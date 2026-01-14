'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ReadAnswerButtonProps {
  onRead: () => void
  onStop: () => void
  isSpeaking: boolean
  status: 'loading' | 'ready' | 'generating' | 'playing' | 'error' | 'idle'
}

export function ReadAnswerButton({ onRead, onStop, isSpeaking, status }: ReadAnswerButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isActivating, setIsActivating] = useState(false) // Local "clicked" state for immediate feedback
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleIdRef = useRef(0)

  // Clear activating state when TTS actually starts or errors
  useEffect(() => {
    if (status === 'playing' || status === 'generating' || status === 'error' || isSpeaking) {
      setIsActivating(false)
    }
  }, [status, isSpeaking])

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [])

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++rippleIdRef.current

    setRipples(prev => [...prev, { id, x, y }])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Immediate visual feedback
    setIsPressed(true)
    createRipple(e)
    triggerHaptic()

    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 200)

    // Trigger action
    if (isSpeaking) {
      onStop()
      setIsActivating(false)
    } else {
      // Set activating state IMMEDIATELY for visual feedback
      setIsActivating(true)
      onRead()

      // Safety timeout: clear activating if TTS never responds
      setTimeout(() => setIsActivating(false), 5000)
    }
  }, [isSpeaking, onRead, onStop, createRipple, triggerHaptic])

  const isDisabled = status === 'generating' || status === 'loading' || isActivating
  const isActive = isSpeaking || status === 'generating' || isPressed || isActivating

  // Determine button state for styling
  const getButtonStyle = () => {
    if (isSpeaking) {
      return {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
      }
    }
    if (status === 'generating' || status === 'loading' || isPressed) {
      return {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        boxShadow: '0 0 30px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
      }
    }
    return {
      background: 'linear-gradient(135deg, #3b3548 0%, #2d2838 100%)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    }
  }

  const getButtonText = () => {
    if (status === 'loading') return 'Loading Voice...'
    if (status === 'generating' || isActivating) return 'Preparing...'
    if (isSpeaking) return 'Stop Reading'
    return 'Read Answer'
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isDisabled}
      className="relative overflow-hidden flex-1 flex items-center justify-center gap-3 py-5 text-xl font-bold rounded-2xl transition-all duration-200 disabled:opacity-70"
      style={{
        ...getButtonStyle(),
        color: 'white',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        border: isActive ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
      }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            background: 'rgba(255, 255, 255, 0.4)',
          }}
        />
      ))}

      {/* Pulse ring when active */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-2xl animate-pulse-ring"
          style={{
            border: '3px solid rgba(255,255,255,0.4)',
          }}
        />
      )}

      {/* Icon */}
      {status === 'loading' || status === 'generating' || isActivating ? (
        <LoadingSpinner />
      ) : (
        <SpeakerIcon isSpeaking={isSpeaking} />
      )}

      {/* Text */}
      <span className="relative z-10">{getButtonText()}</span>
    </button>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="60 40"
      />
    </svg>
  )
}

function SpeakerIcon({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5L6 9H2v6h4l5 4V5z" fill={isSpeaking ? 'currentColor' : 'none'} />
      {isSpeaking ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-pulse" style={{ animationDelay: '0.15s' }} />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  )
}
