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
    <div className="w-full flex gap-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your question..."
        aria-label="Type your question"
        rows={2}
        className="flex-1 p-4 text-xl leading-snug rounded-2xl
                   bg-zinc-800 text-white placeholder-zinc-400
                   border-3 border-zinc-600 focus:border-amber-400
                   focus:outline-none focus:ring-2 focus:ring-amber-400/30
                   disabled:opacity-50 disabled:cursor-not-allowed
                   resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="px-6 text-lg font-bold rounded-2xl shrink-0
                   bg-amber-400 text-zinc-900
                   hover:bg-amber-300 active:bg-amber-500
                   disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed
                   transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-amber-400/50"
      >
        {disabled ? '...' : 'Ask'}
      </button>
    </div>
  )
}
