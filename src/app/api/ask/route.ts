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
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    })

    const response =
      result.text ??
      "I'm sorry, I couldn't understand that. Could you try asking in a different way?"

    // Increment quota after successful response
    const updatedQuota = await incrementQuota(session.user.id)

    return NextResponse.json({
      response,
      remaining: updatedQuota.remaining,
      limit: updatedQuota.limit,
    })
  } catch (error) {
    console.error('Error in /api/ask:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
