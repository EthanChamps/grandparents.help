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

      // Add user message to history
      const userMessage: Message = { role: 'user', content: question }
      const updatedHistory = [...messages, userMessage]
      setMessages(updatedHistory)

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            history: messages, // Send previous history (not including current question)
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
    <div className="min-h-dvh flex flex-col safe-area-inset">
      {/* Header */}
      <header className="p-6 text-center border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-amber-400">GuardRails</h1>
        <p className="text-xl text-zinc-400 mt-2">Tech Help for Seniors</p>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full overflow-y-auto">
        {/* Question prompt */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">
            What do you need help with?
          </h2>
        </div>

        {/* Text input */}
        <TextInput onSubmit={askQuestion} disabled={isLoading} />

        {/* Voice and Camera buttons */}
        <div className="flex gap-4">
          <VoiceInput onTranscript={askQuestion} disabled={isLoading} />
          <CameraButton disabled={isLoading} />
        </div>

        {/* Chat history */}
        <ChatHistory
          messages={messages}
          isLoading={isLoading}
          latestResponse={latestResponse?.content}
          onClear={clearHistory}
        />
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-zinc-500 text-lg border-t border-zinc-800">
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
