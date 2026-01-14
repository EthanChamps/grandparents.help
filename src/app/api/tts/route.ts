import { NextResponse } from 'next/server'

// TTS is now handled client-side via Web Worker
// This route is kept for backwards compatibility but returns an error
export async function POST() {
  return NextResponse.json(
    { error: 'TTS is handled client-side. Use the useTTS hook.' },
    { status: 400 }
  )
}
