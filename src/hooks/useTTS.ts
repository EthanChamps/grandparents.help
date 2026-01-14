'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type TTSStatus = 'idle' | 'generating' | 'playing' | 'error'

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  status: TTSStatus
  isSpeaking: boolean
  error: string | null
}

export function useTTS(): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const stop = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setStatus('idle')
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Stop any current playback
    stop()
    setError(null)

    try {
      setStatus('generating')

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      // Call server API to generate speech
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      // Get audio blob
      const audioBlob = await response.blob()

      // Cleanup previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = url
      audioRef.current.playbackRate = 0.95 // Slightly slower for seniors

      // Handle playback events
      audioRef.current.onplay = () => setStatus('playing')
      audioRef.current.onended = () => setStatus('idle')
      audioRef.current.onerror = () => {
        setStatus('error')
        setError('Failed to play audio')
      }

      setStatus('playing')
      await audioRef.current.play()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, not an error
        setStatus('idle')
        return
      }

      console.error('TTS error:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to generate speech')

      // Fallback to Web Speech API
      fallbackToWebSpeech(text)
    }
  }, [stop])

  const isSpeaking = status === 'playing' || status === 'generating'

  return {
    speak,
    stop,
    status,
    isSpeaking,
    error,
  }
}

// Fallback to browser's built-in TTS if Gemini fails
function fallbackToWebSpeech(text: string) {
  if (!('speechSynthesis' in window)) return

  speechSynthesis.cancel()

  const plainText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`/g, '')

  const utterance = new SpeechSynthesisUtterance(plainText)
  utterance.rate = 0.85
  utterance.pitch = 1
  utterance.lang = 'en-GB'

  speechSynthesis.speak(utterance)
}
