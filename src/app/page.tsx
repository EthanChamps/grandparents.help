'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { ReadAnswerButton } from '@/components/ReadAnswerButton'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [autoRead, setAutoRead] = useState(false) // Default OFF
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousResponseRef = useRef<string | undefined>(undefined)

  // Kokoro TTS hook
  const { speak, stop: stopSpeaking, isSpeaking, isReady: ttsReady, status: ttsStatus } = useTTS()

  // Load autoRead preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('guardrails-autoread')
    if (saved !== null) {
      setAutoRead(saved === 'true')
    }
  }, [])

  // Save autoRead preference to localStorage
  const toggleAutoRead = useCallback(() => {
    setAutoRead(prev => {
      const newValue = !prev
      localStorage.setItem('guardrails-autoread', String(newValue))
      return newValue
    })
  }, [])

  const latestResponse = messages.filter((m) => m.role === 'assistant').pop()?.content

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-speak new responses when autoRead is enabled
  useEffect(() => {
    if (autoRead && latestResponse && latestResponse !== previousResponseRef.current && !isLoading) {
      previousResponseRef.current = latestResponse
      speak(latestResponse)
    }
  }, [latestResponse, isLoading, speak, autoRead])

  const askQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return

      setIsLoading(true)
      setInputValue('')

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
    stopSpeaking()
    setMessages([])
    previousResponseRef.current = undefined
  }, [stopSpeaking])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion(inputValue)
    }
  }

  const hasConversation = messages.length > 0

  return (
    <div className="h-dvh flex flex-col safe-area-inset" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--amber-glow)' }}>
            GuardRails
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your friendly tech helper
          </p>
        </div>

        {/* Auto-read toggle */}
        <button
          onClick={toggleAutoRead}
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
          style={{
            background: autoRead ? 'var(--amber-glow)' : 'var(--bg-elevated)',
            color: autoRead ? 'var(--bg-deep)' : 'var(--text-secondary)',
          }}
          aria-label={autoRead ? 'Auto-read is on' : 'Auto-read is off'}
        >
          <SpeakerIcon className="w-5 h-5" />
          <span className="text-sm font-semibold hidden sm:inline">
            {autoRead ? 'Reading On' : 'Reading Off'}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!hasConversation ? (
          /* Empty State - Hero Input */
          <div className="flex-1 flex flex-col items-center justify-center p-6 stagger-children">
            <div className="w-full max-w-xl text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                   style={{ background: 'var(--bg-card)' }}>
                <QuestionIcon className="w-10 h-10" style={{ color: 'var(--amber-glow)' }} />
              </div>
              <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                What do you need help with?
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Ask me anything about technology. I&apos;ll explain it simply.
              </p>
            </div>

            {/* Hero Input Card */}
            <div className="w-full max-w-xl card p-8 glow-amber">
              {/* Input label */}
              <label
                htmlFor="main-question-input"
                className="block text-lg font-bold mb-3"
                style={{ color: 'var(--amber-soft)' }}
              >
                Type your question below:
              </label>

              <textarea
                id="main-question-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="For example: How do I scan a QR code?"
                rows={4}
                className="w-full input-large resize-none mb-5"
                style={{ minHeight: '140px' }}
                aria-label="Type your question"
              />

              <button
                onClick={() => askQuestion(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="w-full btn btn-primary py-6 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendIcon className="w-7 h-7" />
                {isLoading ? 'Thinking...' : 'Ask Question'}
              </button>

              {/* Alternative input methods */}
              <div className="mt-6 pt-5" style={{ borderTop: '2px solid var(--bg-elevated)' }}>
                <p className="text-center text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                  Or use these options:
                </p>
                <div className="flex gap-3">
                  <VoiceButton onTranscript={askQuestion} disabled={isLoading} />
                  <CameraButton disabled={isLoading} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Conversation View */
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`animate-fade-in-up ${
                    msg.role === 'user' ? 'ml-8' : 'mr-4'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className="p-5 rounded-3xl"
                    style={{
                      background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      border: msg.role === 'assistant' ? '3px solid var(--amber-glow)' : 'none',
                    }}
                  >
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide"
                       style={{ color: 'var(--text-muted)' }}>
                      {msg.role === 'user' ? 'You asked' : 'Answer'}
                    </p>
                    <div className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <FormattedResponse content={msg.content} />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading */}
              {isLoading && (
                <div className="mr-4 animate-fade-in-up">
                  <div className="p-5 rounded-3xl" style={{ background: 'var(--bg-card)', border: '3px solid var(--bg-elevated)' }}>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-8 h-8 border-4 rounded-full animate-spin"
                        style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }}
                      />
                      <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                        Thinking...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="shrink-0 p-4 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-elevated)' }}>
              {/* Read/Stop button */}
              {latestResponse && (
                <div className="flex gap-3 mb-4">
                  <ReadAnswerButton
                    onRead={() => speak(latestResponse)}
                    onStop={stopSpeaking}
                    isSpeaking={isSpeaking}
                    status={ttsStatus}
                  />
                  <button
                    onClick={clearHistory}
                    className="btn btn-ghost px-6 py-4 text-lg"
                  >
                    New Topic
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="flex gap-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask another question..."
                  rows={2}
                  disabled={isLoading}
                  className="flex-1 input-large resize-none disabled:opacity-50"
                  aria-label="Ask another question"
                />
                <button
                  onClick={() => askQuestion(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send question"
                >
                  <SendIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-3 mt-3">
                <VoiceButton onTranscript={askQuestion} disabled={isLoading} compact />
                <CameraButton disabled={isLoading} compact />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 text-center border-t" style={{ borderColor: 'var(--bg-elevated)' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Need urgent help?{' '}
          <a href="tel:" className="underline" style={{ color: 'var(--amber-glow)' }}>
            Call a family member
          </a>
        </p>
      </footer>
    </div>
  )
}

/* Formatted Response with simple markdown */
function FormattedResponse({ content }: { content: string }) {
  // Simple markdown parsing for bold and lists
  const lines = content.split('\n')

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        // Handle numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}>
                {numberedMatch[1]}
              </span>
              <span className="flex-1 pt-1">{formatBold(numberedMatch[2])}</span>
            </div>
          )
        }

        // Handle bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-3 ml-2">
              <span style={{ color: 'var(--amber-glow)' }}>•</span>
              <span>{formatBold(line.slice(2))}</span>
            </div>
          )
        }

        // Regular paragraph
        if (line.trim()) {
          return <p key={i}>{formatBold(line)}</p>
        }

        return null
      })}
    </div>
  )
}

function formatBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold" style={{ color: 'var(--amber-soft)' }}>{part}</strong>
    ) : (
      part
    )
  )
}

/* Voice Input Button */
function VoiceButton({
  onTranscript,
  disabled,
  compact = false
}: {
  onTranscript: (text: string) => void
  disabled?: boolean
  compact?: boolean
}) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || disabled || isListening) return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-GB'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [isSupported, disabled, isListening, onTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  if (!isSupported) {
    return (
      <button
        disabled
        className={`btn btn-secondary flex-1 ${compact ? 'py-3' : 'py-4'} opacity-50 cursor-not-allowed`}
      >
        <MicIcon className="w-6 h-6" />
        <span>Not Available</span>
      </button>
    )
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`btn flex-1 ${compact ? 'py-3' : 'py-4'} text-lg disabled:opacity-50`}
      style={{
        background: isListening ? 'var(--error)' : 'var(--bg-elevated)',
        color: isListening ? 'white' : 'var(--text-primary)',
        animation: isListening ? 'pulse-soft 1s ease-in-out infinite' : 'none',
      }}
      aria-label={isListening ? 'Stop listening' : 'Speak your question'}
    >
      <MicIcon className="w-6 h-6" />
      <span>{isListening ? 'Listening...' : 'Speak'}</span>
    </button>
  )
}

/* Camera Button */
function CameraButton({ disabled, compact = false }: { disabled?: boolean, compact?: boolean }) {
  return (
    <a
      href="/camera"
      className={`btn btn-primary flex-1 ${compact ? 'py-3' : 'py-4'} text-lg ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
      aria-label="Take a photo to ask about"
    >
      <CameraIcon className="w-6 h-6" />
      <span>Show Me</span>
    </a>
  )
}

/* Icons */
function QuestionIcon({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  )
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 15.2c1.87 0 3.4-1.52 3.4-3.4 0-1.87-1.53-3.4-3.4-3.4-1.88 0-3.4 1.53-3.4 3.4 0 1.88 1.52 3.4 3.4 3.4zm8-10.8H16l-1.5-1.6c-.32-.34-.78-.5-1.24-.5h-2.52c-.46 0-.92.17-1.24.5L8 4.4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-8 13.2c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/* TypeScript declarations for Web Speech API */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}
