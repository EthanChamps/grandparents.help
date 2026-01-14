import { getGemini, GEMINI_MODEL } from '@/lib/gemini'
import { TECH_HELPER_SYSTEM_PROMPT } from '@/lib/prompts'
import { containsBlockedContent, BLOCKED_RESPONSE } from '@/lib/guardrails'
import { logEvent } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a question' },
        { status: 400 }
      )
    }

    // Log the question event
    await logEvent(null, 'question_asked', {
      inputMethod: 'text',
      questionLength: question.length,
    })

    // Check for blocked content before sending to AI
    if (containsBlockedContent(question)) {
      return NextResponse.json({ response: BLOCKED_RESPONSE })
    }

    const ai = getGemini()
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: TECH_HELPER_SYSTEM_PROMPT },
            { text: `\n\nUser question: ${question}` },
          ],
        },
      ],
    })

    const response =
      result.text ??
      "I'm sorry, I couldn't understand that. Could you try asking in a different way?"

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in /api/ask:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
