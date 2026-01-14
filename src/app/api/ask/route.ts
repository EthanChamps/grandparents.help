import { getGemini, GEMINI_MODEL } from '@/lib/gemini'
import { TECH_HELPER_SYSTEM_PROMPT } from '@/lib/prompts'
import { containsBlockedContent, BLOCKED_RESPONSE } from '@/lib/guardrails'
import { logEvent } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkQuota, incrementQuota } from '@/lib/quota'

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

    const response = result.text

    // Increment quota after successful response
    const updatedQuota = await incrementQuota(session.user.id)

    return NextResponse.json({
      response,
      remaining: updatedQuota.remaining,
      limit: updatedQuota.limit,
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
