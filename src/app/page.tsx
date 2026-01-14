'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTTS } from '@/hooks/useTTS'
import { ReadAnswerButton } from '@/components/ReadAnswerButton'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Quota {
  remaining: number
  limit: number
  used: number
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [autoRead, setAutoRead] = useState(false) // Default OFF
  const [quota, setQuota] = useState<Quota | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)
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

  // Fetch quota on mount
  useEffect(() => {
    fetch('/api/quota')
      .then((res) => res.json())
      .then((data) => {
        if (data.remaining !== undefined) {
          setQuota(data)
          setQuotaExceeded(data.remaining === 0)
        }
      })
      .catch(() => {
        // Silently fail - user may not be logged in
      })
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

        // Handle quota exceeded
        if (data.error === 'quota_exceeded') {
          setQuotaExceeded(true)
          setQuota((prev) => prev ? { ...prev, remaining: 0 } : null)
          const errorMessage: Message = {
            role: 'assistant',
            content: data.message || "You've used all your free questions for today. Please try again tomorrow or upgrade for unlimited access.",
          }
          setMessages([...updatedHistory, errorMessage])
          return
        }

        // Update quota from response
        if (data.remaining !== undefined) {
          setQuota((prev) => prev ? {
            ...prev,
            remaining: data.remaining,
            used: prev.limit - data.remaining,
          } : { remaining: data.remaining, limit: data.limit, used: data.limit - data.remaining })
          setQuotaExceeded(data.remaining === 0)
        }

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
      {/* Compact Header - Essential controls only */}
      <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
        {/* Minimal branding - just icon/name */}
        <span className="text-base sm:text-lg font-bold" style={{ color: 'var(--amber-glow)' }}>
          GuardRails
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quota - compact but readable */}
          {quota && (
            <div
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold"
              style={{
                background: quota.remaining <= 3 ? 'var(--error)' : 'var(--bg-elevated)',
                color: quota.remaining <= 3 ? 'white' : 'var(--text-secondary)',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {quota.remaining}/{quota.limit}
            </div>
          )}

          {/* Auto-read toggle - accessible touch target */}
          <button
            onClick={toggleAutoRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all"
            style={{
              background: autoRead ? 'var(--amber-glow)' : 'var(--bg-elevated)',
              color: autoRead ? 'var(--bg-deep)' : 'var(--text-secondary)',
              minHeight: '44px',
              minWidth: '44px',
            }}
            aria-label={autoRead ? 'Auto-read is on' : 'Auto-read is off'}
          >
            <SpeakerIcon className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-semibold">
              {autoRead ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!hasConversation ? (
          /* Empty State - Hero Input */
          <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 stagger-children">
            <div className="w-full max-w-xl text-center mb-4 sm:mb-6 shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
                What do you need help with?
              </h2>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                Ask me anything about technology.
              </p>
            </div>

            {/* Hero Input Card */}
            <div className="w-full max-w-xl card glow-amber shrink-0">
              {/* Input label */}
              <label
                htmlFor="main-question-input"
                className="block text-sm sm:text-base font-bold mb-2 sm:mb-3"
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
                rows={3}
                className="w-full input-large resize-none mb-3 sm:mb-4"
                style={{ fontSize: '1rem' }}
                aria-label="Type your question"
              />

              <button
                onClick={() => askQuestion(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="w-full btn btn-primary py-4 sm:py-5 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '60px' }}
              >
                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {isLoading ? 'Thinking...' : 'Ask Question'}
              </button>

              {/* Alternative input methods */}
              <div className="mt-4 pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3" style={{ borderTop: '2px solid var(--bg-elevated)' }}>
                <VoiceButton onTranscript={askQuestion} disabled={isLoading} compact />
                <CameraButton disabled={isLoading} compact isPaidUser={false} />
              </div>
            </div>
          </div>
        ) : (
          /* Conversation View - Maximized for reading */
          <>
            {/* Messages - More space for content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`animate-fade-in-up ${
                    msg.role === 'user' ? 'ml-4 sm:ml-6' : ''
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                    style={{
                      background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      border: msg.role === 'assistant' ? '2px solid var(--amber-glow)' : 'none',
                    }}
                  >
                    <p className="text-xs font-semibold mb-1 sm:mb-1.5 uppercase tracking-wide"
                       style={{ color: 'var(--text-muted)' }}>
                      {msg.role === 'user' ? 'You' : 'Answer'}
                    </p>
                    <div className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
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
                <div className="animate-fade-in-up">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl" style={{ background: 'var(--bg-card)', border: '2px solid var(--bg-elevated)' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 border-3 rounded-full animate-spin flex-shrink-0"
                        style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }}
                      />
                      <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                        Thinking...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Bottom Bar - Minimal footprint */}
            <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-elevated)' }}>
              {/* Action buttons row - touch-friendly */}
              {latestResponse && (
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  {/* Read/Stop - prominent touch target */}
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(latestResponse)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all"
                    style={{
                      background: isSpeaking ? 'var(--error)' : 'var(--amber-glow)',
                      color: isSpeaking ? 'white' : 'var(--bg-deep)',
                      minHeight: '52px',
                    }}
                    aria-label={isSpeaking ? 'Stop reading' : 'Read answer aloud'}
                  >
                    {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                    <span>{isSpeaking ? 'Stop' : 'Read'}</span>
                  </button>

                  {/* Voice input - icon only in conversation */}
                  <VoiceButtonCompact onTranscript={askQuestion} disabled={isLoading} />

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* New Topic - subtle but accessible */}
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      minHeight: '52px',
                    }}
                  >
                    <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </div>
              )}

              {/* Compact Input Row */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up..."
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-3 rounded-xl text-sm sm:text-base disabled:opacity-50"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '2px solid transparent',
                    minHeight: '52px',
                  }}
                  aria-label="Ask another question"
                />
                <button
                  onClick={() => askQuestion(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex items-center justify-center rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  style={{
                    background: inputValue.trim() ? 'var(--amber-glow)' : 'var(--bg-elevated)',
                    color: inputValue.trim() ? 'var(--bg-deep)' : 'var(--text-muted)',
                    width: '52px',
                    height: '52px',
                  }}
                  aria-label="Send question"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer - Only show on empty state */}
      {!hasConversation && (
        <footer className="shrink-0 px-4 sm:px-6 py-3 text-center border-t" style={{ borderColor: 'var(--bg-elevated)' }}>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Need urgent help?{' '}
            <a href="tel:" className="underline font-medium" style={{ color: 'var(--amber-glow)' }}>
              Call a family member
            </a>
          </p>
        </footer>
      )}
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
        className={`btn btn-secondary flex-1 ${compact ? 'py-3 sm:py-4' : 'py-4'} opacity-50 cursor-not-allowed`}
        style={{ minHeight: '56px' }}
      >
        <MicIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-sm sm:text-base">Not Available</span>
      </button>
    )
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`btn flex-1 ${compact ? 'py-3 sm:py-4' : 'py-4'} text-sm sm:text-lg disabled:opacity-50`}
      style={{
        background: isListening ? 'var(--error)' : 'var(--bg-elevated)',
        color: isListening ? 'white' : 'var(--text-primary)',
        animation: isListening ? 'pulse-soft 1s ease-in-out infinite' : 'none',
        minHeight: '56px',
      }}
      aria-label={isListening ? 'Stop listening' : 'Speak your question'}
    >
      <MicIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span>{isListening ? 'Listening...' : 'Speak'}</span>
    </button>
  )
}

/* Compact Voice Button for conversation view - icon only */
function VoiceButtonCompact({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void
  disabled?: boolean
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
    return null // Hide if not supported
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className="flex items-center justify-center rounded-xl disabled:opacity-50 transition-all flex-shrink-0"
      style={{
        background: isListening ? 'var(--error)' : 'var(--bg-elevated)',
        color: isListening ? 'white' : 'var(--text-primary)',
        width: '52px',
        height: '52px',
        animation: isListening ? 'pulse-soft 1s ease-in-out infinite' : 'none',
      }}
      aria-label={isListening ? 'Stop listening' : 'Speak your question'}
    >
      <MicIcon className="w-5 h-5" />
    </button>
  )
}

/* Camera Button - Disabled for free users */
function CameraButton({
  disabled,
  compact = false,
  isPaidUser = false,
}: {
  disabled?: boolean
  compact?: boolean
  isPaidUser?: boolean
}) {
  // Free users can't use camera
  const isBlocked = !isPaidUser

  if (isBlocked) {
    return (
      <button
        disabled
        className={`btn flex-1 ${compact ? 'py-3 sm:py-4' : 'py-4'} text-sm sm:text-lg opacity-60 cursor-not-allowed`}
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          minHeight: '56px',
        }}
        title="Upgrade for image analysis"
        aria-label="Camera - upgrade required"
      >
        <LockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        <span>Upgrade</span>
      </button>
    )
  }

  return (
    <a
      href="/camera"
      className={`btn btn-primary flex-1 ${compact ? 'py-3 sm:py-4' : 'py-4'} text-sm sm:text-lg ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
      style={{ minHeight: '56px' }}
      aria-label="Take a photo to ask about"
    >
      <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z"/>
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
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
