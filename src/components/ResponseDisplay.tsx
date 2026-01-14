'use client'

import { useEffect, useState, useCallback } from 'react'

interface ResponseDisplayProps {
  response: string
  isLoading?: boolean
}

export function ResponseDisplay({ response, isLoading }: ResponseDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85 // Slower for seniors
    utterance.pitch = 1
    utterance.lang = 'en-GB'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // Auto-speak new responses
  useEffect(() => {
    if (response && !isLoading) {
      speak(response)
    }
    return () => {
      speechSynthesis.cancel()
    }
  }, [response, isLoading, speak])

  if (isLoading) {
    return (
      <div className="w-full p-8 rounded-2xl bg-zinc-800 border-4 border-zinc-600">
        <div className="flex items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
          <p className="text-2xl text-zinc-300">Thinking...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return null
  }

  return (
    <div className="w-full space-y-4">
      <div className="p-8 rounded-2xl bg-zinc-800 border-4 border-amber-400/50">
        <p
          className="text-2xl leading-relaxed text-white whitespace-pre-wrap"
          style={{ fontSize: '24px', lineHeight: '1.6' }}
        >
          {response}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => (isSpeaking ? stopSpeaking() : speak(response))}
          className={`flex-1 h-16 text-xl font-bold rounded-2xl
                      flex items-center justify-center gap-3
                      transition-colors duration-150
                      focus:outline-none focus:ring-4 focus:ring-amber-400/50
                      ${
                        isSpeaking
                          ? 'bg-red-500 text-white'
                          : 'bg-zinc-700 text-white hover:bg-zinc-600'
                      }`}
        >
          <SpeakerIcon className="w-8 h-8" />
          {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
        </button>
      </div>
    </div>
  )
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}
