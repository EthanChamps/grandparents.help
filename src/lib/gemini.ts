import { GoogleGenAI } from '@google/genai'

let geminiClient: GoogleGenAI | null = null

export function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    })
  }
  return geminiClient
}

// Using Gemini 2.0 Flash - smallest and fastest model
export const GEMINI_MODEL = 'gemini-2.0-flash'
