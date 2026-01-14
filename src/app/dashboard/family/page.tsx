'use client'

import { useState, useEffect } from 'react'

interface FamilyMember {
  id: string
  name: string
  email?: string
  phone?: string
  role: 'guardian' | 'senior'
  lastActive?: string
  status: 'active' | 'pending'
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    fetchFamilyMembers()
  }, [])

  const fetchFamilyMembers = async () => {
    try {
      const res = await fetch('/api/dashboard/family')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Family Members
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage linked family members and invite seniors
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
          style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
        >
          <PlusIcon className="w-4 h-4" />
          Invite Senior
        </button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
               style={{ background: 'var(--bg-elevated)' }}>
            <UsersIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            No family members linked yet
          </p>
          <p className="text-sm mt-1 mb-6" style={{ color: 'var(--text-muted)' }}>
            Invite a senior to start monitoring their safety
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 rounded-lg font-medium"
            style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
          >
            Invite Your First Senior
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <div className="divide-y" style={{ borderColor: 'var(--bg-elevated)' }}>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          How Family Linking Works
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <StepCard
            number={1}
            title="Send Invite"
            description="Enter your parent's email or phone number to send a magic link"
          />
          <StepCard
            number={2}
            title="They Sign In"
            description="They click the link to access the simplified senior interface"
          />
          <StepCard
            number={3}
            title="Stay Protected"
            description="You'll receive alerts when potential scams are detected"
          />
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onInvite={fetchFamilyMembers} />
      )}
    </div>
  )
}

function MemberRow({ member }: { member: FamilyMember }) {
  const isGuardian = member.role === 'guardian'
  const timeAgo = member.lastActive ? getTimeAgo(new Date(member.lastActive)) : 'Never'

  return (
    <div className="p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
        style={{
          background: isGuardian ? 'var(--amber-glow)' : 'var(--bg-elevated)',
          color: isGuardian ? 'var(--bg-deep)' : 'var(--text-primary)',
        }}
      >
        {member.name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {member.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{
              background: isGuardian ? 'var(--amber-glow)' : 'var(--bg-elevated)',
              color: isGuardian ? 'var(--bg-deep)' : 'var(--text-secondary)',
            }}
          >
            {member.role}
          </span>
          {member.status === 'pending' && (
            <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--text-muted)', color: 'white' }}>
              Pending
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {member.email || member.phone}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last active</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{timeAgo}</p>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3"
        style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
      >
        {number}
      </div>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  )
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: () => void }) {
  const [inviteMethod, setInviteMethod] = useState<'email' | 'phone'>('email')
  const [value, setValue] = useState('')
  const [name, setName] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSending(true)

    try {
      const res = await fetch('/api/dashboard/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          [inviteMethod]: value,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send invite')
      }

      setSuccess(true)
      onInvite()
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--bg-elevated)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Invite a Senior
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 style={{ background: 'var(--success)' }}>
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Invite sent!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              They'll receive a magic link to join your family
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Senior's Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mom, Dad, Grandma"
                required
                className="w-full px-4 py-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: 'none' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Contact Method
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setInviteMethod('email')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: inviteMethod === 'email' ? 'var(--amber-glow)' : 'var(--bg-elevated)',
                    color: inviteMethod === 'email' ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  }}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setInviteMethod('phone')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: inviteMethod === 'phone' ? 'var(--amber-glow)' : 'var(--bg-elevated)',
                    color: inviteMethod === 'phone' ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  }}
                >
                  Phone (SMS)
                </button>
              </div>
              <input
                type={inviteMethod === 'email' ? 'email' : 'tel'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={inviteMethod === 'email' ? 'senior@example.com' : '+1 (555) 123-4567'}
                required
                className="w-full px-4 py-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: 'none' }}
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-lg font-medium"
              style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
            >
              {isSending ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UsersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
