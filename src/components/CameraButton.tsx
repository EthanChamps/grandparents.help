'use client'

import Link from 'next/link'

interface CameraButtonProps {
  disabled?: boolean
}

export function CameraButton({ disabled }: CameraButtonProps) {
  return (
    <Link
      href="/camera"
      className={`flex-1 h-16 text-base font-bold rounded-2xl
                  bg-amber-400 text-zinc-900
                  hover:bg-amber-300 active:bg-amber-500
                  flex items-center justify-center gap-2
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-amber-400/50
                  ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      aria-label="Take a photo to ask about"
    >
      <CameraIcon className="w-6 h-6" />
      <span>Show Me</span>
    </Link>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 15.2c1.87 0 3.4-1.52 3.4-3.4 0-1.87-1.53-3.4-3.4-3.4-1.88 0-3.4 1.53-3.4 3.4 0 1.88 1.52 3.4 3.4 3.4zm8-10.8H16l-1.5-1.6c-.32-.34-.78-.5-1.24-.5h-2.52c-.46 0-.92.17-1.24.5L8 4.4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-8 13.2c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  )
}
