'use client'

import { useState, useRef } from 'react'

interface TextInputProps {
  onSubmit: (question: string) => void
  disabled?: boolean
}

export function TextInput({ onSubmit, disabled }: TextInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full space-y-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your question here..."
        aria-label="Type your question"
        className="w-full min-h-[120px] p-6 text-2xl leading-relaxed rounded-2xl
                   bg-zinc-800 text-white placeholder-zinc-400
                   border-4 border-zinc-600 focus:border-amber-400
                   focus:outline-none focus:ring-4 focus:ring-amber-400/30
                   disabled:opacity-50 disabled:cursor-not-allowed
                   resize-none"
        style={{ fontSize: '24px' }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-full h-20 text-2xl font-bold rounded-2xl
                   bg-amber-400 text-zinc-900
                   hover:bg-amber-300 active:bg-amber-500
                   disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed
                   transition-colors duration-150
                   focus:outline-none focus:ring-4 focus:ring-amber-400/50"
        style={{ minHeight: '80px' }}
      >
        {disabled ? 'Thinking...' : 'Ask Question'}
      </button>
    </div>
  )
}
