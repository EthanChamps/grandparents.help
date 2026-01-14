'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

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

    // Strip markdown for speech
    const plainText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')

    const utterance = new SpeechSynthesisUtterance(plainText)
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
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-2"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-zinc-700 ml-8'
                : 'bg-zinc-800 border-4 border-amber-400/50 mr-4'
            }`}
          >
            <p className="text-sm text-zinc-400 mb-2">
              {msg.role === 'user' ? 'You asked:' : 'Answer:'}
            </p>
            {msg.role === 'user' ? (
              <p className="text-xl leading-relaxed text-white">
                {msg.content}
              </p>
            ) : (
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="text-xl leading-relaxed text-white mb-4 last:mb-0">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-amber-300">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-zinc-300">{children}</em>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside ml-6 space-y-3 text-xl text-white">
                        {children}
                      </ol>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside ml-6 space-y-2 text-xl text-white">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-xl leading-relaxed">{children}</li>
                    ),
                    code: ({ children }) => (
                      <code className="bg-zinc-700 px-2 py-1 rounded text-amber-300">
                        {children}
                      </code>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-amber-400 mb-3">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-amber-400 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-bold text-amber-400 mb-2">{children}</h3>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-5 rounded-2xl bg-zinc-800 border-4 border-zinc-600 mr-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
              <p className="text-xl text-zinc-300">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {messages.length > 0 && (
        <div className="flex gap-4 pt-4 shrink-0">
          {latestResponse && (
            <button
              onClick={() => (isSpeaking ? stopSpeaking() : speak(latestResponse))}
              className={`flex-1 h-14 text-lg font-bold rounded-2xl
                          flex items-center justify-center gap-3
                          transition-colors duration-150
                          focus:outline-none focus:ring-4 focus:ring-amber-400/50
                          ${
                            isSpeaking
                              ? 'bg-red-500 text-white'
                              : 'bg-zinc-700 text-white hover:bg-zinc-600'
                          }`}
            >
              <SpeakerIcon className="w-6 h-6" />
              {isSpeaking ? 'Stop' : 'Read Again'}
            </button>
          )}
          <button
            onClick={onClear}
            className="h-14 px-6 text-lg font-bold rounded-2xl
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
