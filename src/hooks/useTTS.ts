'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { KokoroTTS as KokoroTTSType } from 'kokoro-js'

type TTSStatus = 'idle' | 'loading-model' | 'generating' | 'playing' | 'error'

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  status: TTSStatus
  isModelLoaded: boolean
  isSpeaking: boolean
  error: string | null
  loadProgress: string
}

// Singleton for Kokoro TTS instance
let kokoroInstance: KokoroTTSType | null = null
let kokoroLoadingPromise: Promise<KokoroTTSType> | null = null
let preloadStarted = false

async function loadKokoro(): Promise<KokoroTTSType> {
  if (kokoroInstance) return kokoroInstance

  if (kokoroLoadingPromise) return kokoroLoadingPromise

  kokoroLoadingPromise = (async () => {
    try {
      // Dynamic import for client-side only
      const { KokoroTTS } = await import('kokoro-js')
      const tts = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        {
          dtype: 'q4', // Smaller quantization for faster loading (~25MB vs ~50MB)
          device: 'wasm', // WebAssembly for broad browser support
        }
      )
      kokoroInstance = tts
      return tts
    } catch (error) {
      kokoroLoadingPromise = null
      throw error
    }
  })()

  return kokoroLoadingPromise
}

// Preload model in background without blocking UI
export function preloadTTS(): void {
  if (preloadStarted || typeof window === 'undefined') return
  preloadStarted = true

  // Use requestIdleCallback to load during browser idle time
  // Falls back to setTimeout for browsers without support
  const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 100))

  scheduleLoad(() => {
    loadKokoro().catch((err) => {
      console.warn('TTS preload failed:', err)
      preloadStarted = false // Allow retry
    })
  })
}

// Auto-preload when module is imported (client-side only)
// Deferred to not block initial page render
if (typeof window !== 'undefined') {
  // Wait for page to be interactive first
  if (document.readyState === 'complete') {
    preloadTTS()
  } else {
    window.addEventListener('load', preloadTTS, { once: true })
  }
}

export function useTTS(): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle')
  const [isModelLoaded, setIsModelLoaded] = useState(!!kokoroInstance)
  const [error, setError] = useState<string | null>(null)
  const [loadProgress, setLoadProgress] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const stop = useCallback(() => {
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
      // Load model if needed
      if (!kokoroInstance) {
        setStatus('loading-model')
        setLoadProgress('Loading voice model (first time only)...')
        await loadKokoro()
        setIsModelLoaded(true)
        setLoadProgress('')
      }

      // Generate audio
      setStatus('generating')

      // Strip markdown for cleaner speech
      const plainText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/`/g, '')
        .replace(/\n+/g, ' ')
        .trim()

      const audio = await kokoroInstance!.generate(plainText, {
        voice: 'bf_emma', // British female voice - warm and clear
      })

      // Create audio element and play
      const blob = audio.toBlob()

      // Cleanup previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = url
      audioRef.current.playbackRate = 0.9 // Slightly slower for seniors

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
    isModelLoaded,
    isSpeaking,
    error,
    loadProgress,
  }
}

// Fallback to browser's built-in TTS if Kokoro fails
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
