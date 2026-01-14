'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatHistoryProps {
  messages: Message[]
  isLoading: boolean
  latestResponse?: string
  onClear: () => void
}

export function ChatHistory({
  messages,
  isLoading,
  latestResponse,
  onClear,
}: ChatHistoryProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousResponseRef = useRef<string | undefined>(undefined)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
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
    if (latestResponse && latestResponse !== previousResponseRef.current && !isLoading) {
      previousResponseRef.current = latestResponse
      speak(latestResponse)
    }
  }, [latestResponse, isLoading, speak])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
    }
  }, [])

  if (messages.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto p-2"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-zinc-700 ml-8'
                : 'bg-zinc-800 border-4 border-amber-400/50 mr-8'
            }`}
          >
            <p className="text-sm text-zinc-400 mb-2">
              {msg.role === 'user' ? 'You asked:' : 'Answer:'}
            </p>
            <p
              className="text-xl leading-relaxed text-white whitespace-pre-wrap"
              style={{ fontSize: '20px', lineHeight: '1.6' }}
            >
              {msg.content}
            </p>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-zinc-800 border-4 border-zinc-600 mr-8">
            <div className="flex items-center gap-4">
              <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
              <p className="text-xl text-zinc-300">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {messages.length > 0 && (
        <div className="flex gap-4">
          {latestResponse && (
            <button
              onClick={() => (isSpeaking ? stopSpeaking() : speak(latestResponse))}
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
              {isSpeaking ? 'Stop' : 'Read Again'}
            </button>
          )}
          <button
            onClick={onClear}
            className="h-16 px-6 text-xl font-bold rounded-2xl
                       bg-zinc-700 text-zinc-300 hover:bg-zinc-600
                       transition-colors duration-150
                       focus:outline-none focus:ring-4 focus:ring-amber-400/50"
          >
            New Topic
          </button>
        </div>
      )}
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
