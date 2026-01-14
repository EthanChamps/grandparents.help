'use client'

import { useState, useCallback, useRef, useSyncExternalStore } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// Check support on client side only
function getIsSupported() {
  if (typeof window === 'undefined') return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

function subscribe() {
  // No-op: browser support doesn't change
  return () => {}
}

function getSnapshot() {
  return getIsSupported()
}

function getServerSnapshot() {
  return false
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSupported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Initialize recognition lazily
  const getRecognition = useCallback(() => {
    if (!recognitionRef.current && isSupported) {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition
      const recog = new SpeechRecognitionAPI()
      recog.continuous = false
      recog.interimResults = false
      recog.lang = 'en-GB'
      recognitionRef.current = recog
    }
    return recognitionRef.current
  }, [isSupported])

  const startListening = useCallback(() => {
    const recognition = getRecognition()
    if (!recognition || disabled || isListening) return

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [getRecognition, disabled, isListening, onTranscript])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [isListening])

  if (!isSupported) {
    return (
      <button
        disabled
        className="flex-1 h-24 text-xl font-bold rounded-2xl
                   bg-zinc-700 text-zinc-500 cursor-not-allowed
                   flex flex-col items-center justify-center gap-2"
        style={{ minHeight: '96px', minWidth: '140px' }}
      >
        <MicIcon className="w-10 h-10" />
        <span>Not Available</span>
      </button>
    )
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`flex-1 h-24 text-xl font-bold rounded-2xl
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-150
                  focus:outline-none focus:ring-4 focus:ring-amber-400/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-500'
                  }`}
      style={{ minHeight: '96px', minWidth: '140px' }}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
    >
      <MicIcon className="w-10 h-10" />
      <span>{isListening ? 'Listening...' : 'Speak'}</span>
    </button>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
    </svg>
  )
}
