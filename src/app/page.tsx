'use client'

import { useState, useCallback } from 'react'
import { TextInput } from '@/components/TextInput'
import { VoiceInput } from '@/components/VoiceInput'
import { CameraButton } from '@/components/CameraButton'
import { ChatHistory } from '@/components/ChatHistory'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const askQuestion = useCallback(
    async (question: string) => {
      setIsLoading(true)

      const userMessage: Message = { role: 'user', content: question }
      const updatedHistory = [...messages, userMessage]
      setMessages(updatedHistory)

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            history: messages,
          }),
        })

        const data = await res.json()

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.error || data.response,
        }

        setMessages([...updatedHistory, assistantMessage])
      } catch {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        }
        setMessages([...updatedHistory, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [messages]
  )

  const clearHistory = useCallback(() => {
    setMessages([])
  }, [])

  const latestResponse = messages.filter((m) => m.role === 'assistant').pop()

  return (
    <div className="h-dvh flex flex-col overflow-hidden safe-area-inset">
      {/* Header - fixed height */}
      <header className="px-4 py-3 text-center border-b border-zinc-800 shrink-0">
        <h1 className="text-2xl font-bold text-amber-400">GuardRails</h1>
        <p className="text-base text-zinc-400">Tech Help for Seniors</p>
      </header>

      {/* Main content - responsive two-column on large screens */}
      <main className="flex-1 min-h-0 p-4 w-full max-w-6xl mx-auto">
        <div className="h-full flex flex-col lg:flex-row lg:gap-6">
          {/* Left column: Chat history (or prompt when empty) */}
          <div className="flex-1 min-h-0 mb-4 lg:mb-0 lg:order-1">
            {messages.length === 0 && !isLoading ? (
              <div className="h-full flex items-center justify-center">
                <h2 className="text-xl font-semibold text-white text-center">
                  What do you need help with?
                </h2>
              </div>
            ) : (
              <ChatHistory
                messages={messages}
                isLoading={isLoading}
                latestResponse={latestResponse?.content}
                onClear={clearHistory}
              />
            )}
          </div>

          {/* Right column: Input controls */}
          <div className="shrink-0 lg:w-80 lg:order-2 lg:flex lg:flex-col lg:justify-center space-y-3">
            <TextInput onSubmit={askQuestion} disabled={isLoading} />
            <div className="flex gap-3">
              <VoiceInput onTranscript={askQuestion} disabled={isLoading} />
              <CameraButton disabled={isLoading} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer - fixed height */}
      <footer className="px-4 py-2 text-center text-zinc-500 text-sm border-t border-zinc-800 shrink-0">
        <p>
          Need urgent help?{' '}
          <a href="tel:" className="text-amber-400 underline">
            Call a family member
          </a>
        </p>
      </footer>
    </div>
  )
}
