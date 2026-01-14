'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface FamilyMember {
  id: string
  name: string
  email?: string
  phone?: string
  role: 'guardian' | 'senior'
  lastActive?: string
  status: 'active' | 'pending'
  isCurrentUser?: boolean
}

export default function FamilyPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const userRole = (session?.user as { role?: string } | undefined)?.role

  // Redirect seniors away - they cannot manage family
  useEffect(() => {
    if (!isPending && userRole === 'senior') {
      router.replace('/dashboard')
    }
  }, [userRole, isPending, router])

  useEffect(() => {
    if (!isPending && userRole !== 'senior') {
      fetchFamilyMembers()
    }
  }, [isPending, userRole])

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

  const handleRemove = async (member: FamilyMember) => {
    if (member.isCurrentUser) return

    const confirmMessage = member.status === 'pending'
      ? `Cancel invite for ${member.name}?`
      : `Remove ${member.name} from your family?`

    if (!confirm(confirmMessage)) return

    setRemovingId(member.id)

    try {
      const endpoint = member.status === 'pending'
        ? `/api/dashboard/family/invite/${member.id}`
        : `/api/dashboard/family/member/${member.id}`

      const res = await fetch(endpoint, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove')
      }

      // Remove from local state
      setMembers(prev => prev.filter(m => m.id !== member.id))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove')
    } finally {
      setRemovingId(null)
    }
  }

  // Show loading while checking session or if senior (redirecting)
  if (isPending || isLoading || userRole === 'senior') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 rounded-full animate-spin"
               style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 dash-stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--text-primary)' }}>
            Family Members
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Manage linked family and invite seniors
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="dash-btn dash-btn-primary flex items-center gap-2 w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Invite Senior
        </button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="dash-card">
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <UsersIcon className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="dash-empty-title">No family members linked yet</p>
            <p className="dash-empty-desc">
              Invite a senior to start monitoring their safety
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="dash-btn dash-btn-primary mt-4"
            >
              Invite Your First Senior
            </button>
          </div>
        </div>
      ) : (
        <div className="dash-card">
          <div className="dash-section-header">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {members.length} Member{members.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div>
            {members.map((member, idx) => (
              <MemberRow
                key={member.id}
                member={member}
                isLast={idx === members.length - 1}
                onRemove={() => handleRemove(member)}
                isRemoving={removingId === member.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
            How Family Linking Works
          </h2>
        </div>
        <div className="p-3 sm:p-5">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            <StepCard
              number={1}
              title="Send Invite"
              description="Enter your parent's email or phone to send a magic link"
            />
            <StepCard
              number={2}
              title="They Sign In"
              description="They click the link to access the simplified interface"
            />
            <StepCard
              number={3}
              title="Stay Protected"
              description="You'll receive alerts when scams are detected"
            />
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onInvite={fetchFamilyMembers} />
      )}
    </div>
  )
}

function MemberRow({
  member,
  isLast,
  onRemove,
  isRemoving,
}: {
  member: FamilyMember
  isLast: boolean
  onRemove: () => void
  isRemoving: boolean
}) {
  const isGuardian = member.role === 'guardian'
  const isCurrentUser = member.isCurrentUser
  const timeAgo = member.lastActive ? getTimeAgo(new Date(member.lastActive)) : 'Never'

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
         style={!isLast ? { borderBottom: '1px solid rgba(255, 255, 255, 0.06)' } : {}}>
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0"
        style={{
          background: isGuardian
            ? 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)'
            : 'var(--bg-elevated)',
          color: isGuardian ? 'var(--bg-deep)' : 'var(--text-primary)',
        }}
      >
        {member.name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
            {member.name}
          </span>
          <span className={`dash-badge ${isGuardian ? 'dash-badge-warning' : 'dash-badge-muted'}`}>
            {member.role}
          </span>
          {member.status === 'pending' && (
            <span className="dash-badge dash-badge-muted">Pending</span>
          )}
        </div>
        <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
          {member.email || member.phone}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="text-right hidden md:block">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last active</p>
          <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{timeAgo}</p>
        </div>
        {!isCurrentUser && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="dash-btn dash-btn-ghost p-2"
            style={{ color: 'var(--error)', minHeight: '44px', minWidth: '44px' }}
            title={member.status === 'pending' ? 'Cancel invite' : 'Remove member'}
          >
            {isRemoving ? (
              <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold mb-2 sm:mb-3"
        style={{
          background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)',
          color: 'var(--bg-deep)',
        }}
      >
        {number}
      </div>
      <p className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
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
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-header">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Invite a Senior
          </h2>
          <button
            onClick={onClose}
            className="dash-btn dash-btn-ghost"
            style={{ padding: '0.5rem', minHeight: '44px', minWidth: '44px' }}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="dash-empty">
            <div className="dash-empty-icon" style={{
              background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
            }}>
              <CheckIcon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--success)' }} />
            </div>
            <p className="dash-empty-title">Invite sent!</p>
            <p className="dash-empty-desc">
              They'll receive a magic link to join your family
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="dash-modal-body space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
                Senior's Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mom, Dad, Grandma"
                required
                className="dash-input"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
                Contact Method
              </label>
              <div className="dash-tabs mb-2 sm:mb-3" style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  onClick={() => setInviteMethod('email')}
                  className={`dash-tab ${inviteMethod === 'email' ? 'dash-tab-active' : ''}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setInviteMethod('phone')}
                  className={`dash-tab ${inviteMethod === 'phone' ? 'dash-tab-active' : ''}`}
                >
                  Phone
                </button>
              </div>
              <input
                type={inviteMethod === 'email' ? 'email' : 'tel'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={inviteMethod === 'email' ? 'senior@example.com' : '+1 (555) 123-4567'}
                required
                className="dash-input"
              />
            </div>

            {error && (
              <p className="text-xs sm:text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="dash-btn dash-btn-primary w-full"
              style={{ minHeight: '48px' }}
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

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
