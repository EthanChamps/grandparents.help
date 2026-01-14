import { getGemini, GEMINI_MODEL } from '@/lib/gemini'
import { TECH_HELPER_SYSTEM_PROMPT } from '@/lib/prompts'
import { containsBlockedContent, BLOCKED_RESPONSE } from '@/lib/guardrails'
import { logEvent, db } from '@/lib/db'
import { users, familyMembers, alerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkQuota, incrementQuota } from '@/lib/quota'
import { sendPushToFamily } from '@/lib/push'

interface ScamAnalysis {
  probability: number
  type: string | null
  reason: string | null
}

// Parse scam analysis from AI response
function parseScamAnalysis(response: string): { cleanResponse: string; scamAnalysis: ScamAnalysis | null } {
  const scamRegex = /<<<SCAM_ANALYSIS>>>\s*([\s\S]*?)\s*<<<END_SCAM_ANALYSIS>>>/
  const match = response.match(scamRegex)

  if (!match) {
    return { cleanResponse: response, scamAnalysis: null }
  }

  // Remove the scam analysis from the response
  const cleanResponse = response.replace(scamRegex, '').trim()

  try {
    const scamAnalysis = JSON.parse(match[1]) as ScamAnalysis
    return { cleanResponse, scamAnalysis }
  } catch {
    console.error('Failed to parse scam analysis JSON:', match[1])
    return { cleanResponse, scamAnalysis: null }
  }
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please sign in to ask questions' },
        { status: 401 }
      )
    }

    const { question, history = [] } = (await request.json()) as {
      question: string
      history?: Message[]
    }

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a question' },
        { status: 400 }
      )
    }

    // Check quota before processing
    const quotaStatus = await checkQuota(session.user.id)
    if (!quotaStatus.allowed) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: "You've used your 15 free questions today. Upgrade for unlimited access.",
        remaining: 0,
        limit: quotaStatus.limit,
      }, { status: 429 })
    }

    // Log the question event
    await logEvent(null, 'question_asked', {
      inputMethod: 'text',
      questionLength: question.length,
      historyLength: history.length,
      userId: session.user.id,
    })

    // Check for blocked content before sending to AI
    if (containsBlockedContent(question)) {
      return NextResponse.json({ response: BLOCKED_RESPONSE })
    }

    // Build conversation contents with history
    const contents = [
      // System prompt as first user message
      {
        role: 'user' as const,
        parts: [{ text: TECH_HELPER_SYSTEM_PROMPT }],
      },
      {
        role: 'model' as const,
        parts: [{ text: 'I understand. I will help seniors with their tech questions using simple, step-by-step instructions.' }],
      },
      // Add conversation history
      ...history.map((msg) => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }],
      })),
      // Add current question
      {
        role: 'user' as const,
        parts: [{ text: question }],
      },
    ]

    const ai = getGemini()

    // Retry logic for transient 429 errors
    let result
    let lastError: Error | null = null
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
        })
        break // Success, exit retry loop
      } catch (geminiError) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError))
        const errorMsg = lastError.message || ''

        // Only retry on 429/rate limit errors
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          console.log(`Gemini 429 error, attempt ${attempt}/${maxRetries}. Retrying in ${attempt * 2}s...`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000)) // 2s, 4s, 6s backoff
            continue
          }
        }

        // Non-retryable error or max retries reached
        console.error('Gemini API error:', geminiError)
        throw new Error(`Gemini API failed: ${errorMsg}`)
      }
    }

    if (!result && lastError) {
      throw new Error(`Gemini API failed after ${maxRetries} retries: ${lastError.message}`)
    }

    // Check if we got a valid response
    if (!result || !result.text) {
      console.error('Gemini returned empty response:', {
        hasResult: !!result,
        hasText: !!result?.text,
        candidates: result?.candidates,
        finishReason: result?.candidates?.[0]?.finishReason,
      })

      // Check if blocked by safety filters
      const finishReason = result?.candidates?.[0]?.finishReason
      if (finishReason === 'SAFETY') {
        return NextResponse.json({
          response: "I can't help with that question. Please try asking something else about technology.",
          remaining: (await checkQuota(session.user.id)).remaining,
          limit: 15,
        })
      }

      throw new Error('Gemini returned empty response')
    }

    const rawResponse = result.text

    // Parse scam analysis from response
    const { cleanResponse, scamAnalysis } = parseScamAnalysis(rawResponse)

    // If scam detected with high probability, create alert
    if (scamAnalysis && scamAnalysis.probability >= 0.7) {
      try {
        // Look up senior's custom user ID by email
        const authUserEmail = session.user.email
        if (authUserEmail) {
          const seniorUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, authUserEmail))
            .limit(1)

          if (seniorUser.length > 0) {
            // Look up senior's family
            const membership = await db
              .select({ familyId: familyMembers.familyId })
              .from(familyMembers)
              .where(eq(familyMembers.userId, seniorUser[0].id))
              .limit(1)

            if (membership.length > 0) {
              // Create scam alert
              await db.insert(alerts).values({
                userId: seniorUser[0].id,
                familyId: membership[0].familyId,
                type: 'scam_detected',
                scamProbability: String(scamAnalysis.probability),
                aiAnalysis: `${scamAnalysis.type || 'Unknown scam type'}: ${scamAnalysis.reason || 'Potential scam detected'}. User question: "${question.substring(0, 200)}..."`,
                acknowledged: false,
              })

              console.log(`Scam alert created: probability=${scamAnalysis.probability}, type=${scamAnalysis.type}`)

              // Send push notification to family guardians
              try {
                await sendPushToFamily(membership[0].familyId, {
                  title: '⚠️ Scam Alert',
                  body: `${scamAnalysis.type || 'Potential scam'} detected. ${Math.round(scamAnalysis.probability * 100)}% confidence.`,
                  tag: 'scam-alert',
                  url: '/dashboard/alerts',
                })
              } catch (pushError) {
                console.error('Failed to send push notification:', pushError)
              }
            }
          }
        }
      } catch (alertError) {
        // Don't fail the response if alert creation fails
        console.error('Failed to create scam alert:', alertError)
      }
    }

    // Increment quota after successful response
    const updatedQuota = await incrementQuota(session.user.id)

    return NextResponse.json({
      response: cleanResponse,
      remaining: updatedQuota.remaining,
      limit: updatedQuota.limit,
      scamDetected: scamAnalysis && scamAnalysis.probability >= 0.7 ? {
        probability: scamAnalysis.probability,
        type: scamAnalysis.type,
      } : undefined,
    })
  } catch (error) {
    console.error('Error in /api/ask:', error)

    // More specific error messages for debugging
    let errorMessage = 'Something went wrong. Please try again.'
    let statusCode = 500

    if (error instanceof Error) {
      // Log full error for debugging
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })

      // Check for common issues
      if (error.message.includes('API key')) {
        errorMessage = 'Service configuration error. Please contact support.'
      } else if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota') || error.message.includes('rate')) {
        errorMessage = 'Our helper is taking a short break. Please wait 30 seconds and try again.'
        statusCode = 503 // Service Unavailable - temporary
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
