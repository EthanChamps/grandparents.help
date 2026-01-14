'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type TTSStatus = 'loading' | 'ready' | 'generating' | 'playing' | 'error' | 'idle'

// Lazy-loaded Kokoro instance
let kokoroInstance: unknown = null
let kokoroLoading: Promise<unknown> | null = null

async function loadKokoro() {
  if (kokoroInstance) return kokoroInstance
  if (kokoroLoading) return kokoroLoading

  kokoroLoading = (async () => {
    try {
      // Dynamic import - only loads when called
      const { KokoroTTS } = await import('kokoro-js')

      kokoroInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q4',    // Smallest/fastest (~6MB)
        device: 'wasm', // Browser WASM
      })

      return kokoroInstance
    } catch (error) {
      console.error('Failed to load Kokoro:', error)
      kokoroLoading = null
      throw error
    }
  })()

  return kokoroLoading
}

interface UseTTSReturn {
  speak: (text: string) => void
  stop: () => void
  status: TTSStatus
  isSpeaking: boolean
  isReady: boolean
  error: string | null
}

export function useTTS(): UseTTSReturn {
  // Start as 'ready' - we'll load Kokoro on first speak() call
  const [status, setStatus] = useState<TTSStatus>('ready')
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Cleanup on unmount
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
    // Also stop Web Speech API if running
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setStatus('ready')
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    stop()
    setError(null)

    // Clean text for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/\n+/g, ' ')
      // Remove emojis
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}-\u{3299}]/gu, '')
      .trim()

    // Load Kokoro on first use (if not already loaded)
    if (!kokoroInstance && !kokoroLoading) {
      setStatus('loading')
      try {
        await loadKokoro()
      } catch (err) {
        console.error('Kokoro load failed, using fallback:', err)
        // Continue to fallback
      }
    }

    // Try Kokoro first
    if (kokoroInstance) {
      try {
        setStatus('generating')

        const tts = kokoroInstance as {
          generate: (text: string, opts?: { voice?: string }) => Promise<{ toBlob: () => Blob }>
        }

        const audio = await tts.generate(cleanText, {
          voice: 'af_heart', // Warm female voice
        })

        const blob = audio.toBlob()

        // Cleanup previous URL
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }

        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url

        if (!audioRef.current) {
          audioRef.current = new Audio()
        }

        audioRef.current.src = url
        audioRef.current.playbackRate = 0.95 // Slightly slower for seniors

        audioRef.current.onplay = () => setStatus('playing')
        audioRef.current.onended = () => setStatus('ready')
        audioRef.current.onerror = () => {
          setStatus('error')
          setError('Failed to play audio')
        }

        setStatus('playing')
        await audioRef.current.play()
        return
      } catch (err) {
        console.error('Kokoro TTS error:', err)
        // Fall through to Web Speech API
      }
    }

    // Fallback to Web Speech API
    fallbackToWebSpeech(cleanText, setStatus)
  }, [stop])

  const isReady = status === 'ready' || status === 'idle'
  const isSpeaking = status === 'playing' || status === 'generating'

  return {
    speak,
    stop,
    status,
    isSpeaking,
    isReady,
    error,
  }
}

// Fallback to browser's built-in TTS
function fallbackToWebSpeech(text: string, setStatus: (s: TTSStatus) => void) {
  if (!('speechSynthesis' in window)) {
    setStatus('error')
    return
  }

  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85
  utterance.pitch = 1
  utterance.lang = 'en-GB'

  utterance.onstart = () => setStatus('playing')
  utterance.onend = () => setStatus('ready')
  utterance.onerror = () => setStatus('error')

  speechSynthesis.speak(utterance)
}
