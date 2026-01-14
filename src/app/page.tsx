'use client'

import { useState, useCallback } from 'react'
import { TextInput } from '@/components/TextInput'
import { VoiceInput } from '@/components/VoiceInput'
import { CameraButton } from '@/components/CameraButton'
import { ResponseDisplay } from '@/components/ResponseDisplay'

export default function Home() {
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const askQuestion = useCallback(async (question: string) => {
    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()

      if (data.error) {
        setResponse(data.error)
      } else {
        setResponse(data.response)
      }
    } catch {
      setResponse('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="min-h-dvh flex flex-col safe-area-inset">
      {/* Header */}
      <header className="p-6 text-center border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-amber-400">GuardRails</h1>
        <p className="text-xl text-zinc-400 mt-2">Tech Help for Seniors</p>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-8 max-w-2xl mx-auto w-full">
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

        {/* Response display */}
        <ResponseDisplay response={response} isLoading={isLoading} />
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
