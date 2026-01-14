'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Activity {
  id: string
  type: 'message' | 'alert'
  content: string
  seniorName: string
  createdAt: string
  scamProbability?: number
}

interface DashboardStats {
  totalAlerts: number
  unacknowledgedAlerts: number
  linkedSeniors: number
  recentQuestions: number
}

export default function DashboardOverview() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [activityRes, statsRes] = await Promise.all([
        fetch('/api/dashboard/activity'),
        fetch('/api/dashboard/stats'),
      ])

      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivities(data.activities || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 rounded-full animate-spin"
               style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 dash-stagger">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Monitor your family members' activity and safety
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Unread Alerts"
          value={stats?.unacknowledgedAlerts ?? 0}
          icon={<AlertIcon className="w-5 h-5" />}
          variant={stats?.unacknowledgedAlerts && stats.unacknowledgedAlerts > 0 ? 'error' : 'default'}
        />
        <StatCard
          label="Total Alerts"
          value={stats?.totalAlerts ?? 0}
          icon={<BellIcon className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label="Linked Seniors"
          value={stats?.linkedSeniors ?? 0}
          icon={<UsersIcon className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label="Questions (7d)"
          value={stats?.recentQuestions ?? 0}
          icon={<ChatIcon className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Alert Banner */}
      {stats?.unacknowledgedAlerts && stats.unacknowledgedAlerts > 0 && (
        <div className="dash-alert-banner">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'var(--error)' }}>
            <AlertIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {stats.unacknowledgedAlerts} unread alert{stats.unacknowledgedAlerts > 1 ? 's' : ''} require attention
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Potential scam detected - review immediately
            </p>
          </div>
          <Link href="/dashboard/alerts" className="dash-btn dash-btn-primary flex-shrink-0">
            View Alerts
          </Link>
        </div>
      )}

      {/* Activity Feed */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Recent Activity
          </h2>
        </div>

        {activities.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <ChatIcon className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="dash-empty-title">No activity yet</p>
            <p className="dash-empty-desc">
              Activity will appear here when your family members use the app
            </p>
          </div>
        ) : (
          <>
            <div>
              {activities.map((activity, idx) => (
                <ActivityItem key={activity.id} activity={activity} isLast={idx === activities.length - 1} />
              ))}
            </div>
            <div className="p-4">
              <Link href="/dashboard/alerts" className="text-sm font-medium"
                    style={{ color: 'var(--amber-glow)' }}>
                View all activity →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: number
  icon: React.ReactNode
  variant?: 'default' | 'error' | 'success'
}) {
  const isError = variant === 'error'

  return (
    <div className={`dash-card dash-card-hover dash-stat ${isError ? '' : ''}`}
         style={isError ? {
           background: 'rgba(248, 113, 113, 0.08)',
           border: '1px solid rgba(248, 113, 113, 0.2)',
         } : {}}>
      <div className="dash-stat-icon" style={isError ? {
        background: 'var(--error)',
        color: 'white',
      } : {}}>
        {icon}
      </div>
      <div>
        <p className="dash-stat-value" style={isError ? { color: 'var(--error)' } : {}}>
          {value}
        </p>
        <p className="dash-stat-label">{label}</p>
      </div>
    </div>
  )
}

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const isAlert = activity.type === 'alert'
  const date = new Date(activity.createdAt)
  const timeAgo = getTimeAgo(date)

  return (
    <div className="flex gap-4 p-4" style={!isLast ? { borderBottom: '1px solid rgba(255, 255, 255, 0.06)' } : {}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{
             background: isAlert ? 'var(--error)' : 'var(--bg-elevated)',
             color: isAlert ? 'white' : 'var(--text-secondary)',
           }}>
        {isAlert ? <AlertIcon className="w-5 h-5" /> : <ChatIcon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {activity.seniorName}
          </span>
          {isAlert && (
            <span className="dash-badge dash-badge-error">Alert</span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {timeAgo}
          </span>
        </div>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
          {activity.content}
        </p>
        {activity.scamProbability !== undefined && activity.scamProbability > 0.5 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--error)' }}>
            Scam probability: {Math.round(activity.scamProbability * 100)}%
          </p>
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

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ChatIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
