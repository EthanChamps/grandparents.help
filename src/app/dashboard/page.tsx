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
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor your family members' activity and safety
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Unread Alerts"
          value={stats?.unacknowledgedAlerts ?? 0}
          icon={<AlertIcon />}
          highlight={stats?.unacknowledgedAlerts ? stats.unacknowledgedAlerts > 0 : false}
        />
        <StatCard
          label="Total Alerts"
          value={stats?.totalAlerts ?? 0}
          icon={<BellIcon />}
        />
        <StatCard
          label="Linked Seniors"
          value={stats?.linkedSeniors ?? 0}
          icon={<UsersIcon />}
        />
        <StatCard
          label="Questions (7d)"
          value={stats?.recentQuestions ?? 0}
          icon={<ChatIcon />}
        />
      </div>

      {/* Quick Actions */}
      {stats?.unacknowledgedAlerts && stats.unacknowledgedAlerts > 0 && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid var(--error)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--error)' }}>
                <AlertIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {stats.unacknowledgedAlerts} unread alert{stats.unacknowledgedAlerts > 1 ? 's' : ''}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Potential scam detected - review immediately
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/alerts"
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{ background: 'var(--error)', color: 'white' }}
            >
              View Alerts
            </Link>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Activity
          </h2>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 style={{ background: 'var(--bg-elevated)' }}>
              <ChatIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              No activity yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Activity will appear here when your family members use the app
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--bg-elevated)' }}>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {activities.length > 0 && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--bg-elevated)' }}>
            <Link
              href="/dashboard/alerts"
              className="text-sm font-medium"
              style={{ color: 'var(--amber-glow)' }}
            >
              View all activity →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: highlight ? 'rgba(248, 113, 113, 0.1)' : 'var(--bg-card)',
        border: highlight ? '1px solid var(--error)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: highlight ? 'var(--error)' : 'var(--bg-elevated)',
            color: highlight ? 'white' : 'var(--text-secondary)',
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: highlight ? 'var(--error)' : 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const isAlert = activity.type === 'alert'
  const date = new Date(activity.createdAt)
  const timeAgo = getTimeAgo(date)

  return (
    <div className="p-4 flex gap-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: isAlert ? 'var(--error)' : 'var(--bg-elevated)',
          color: isAlert ? 'white' : 'var(--text-secondary)',
        }}
      >
        {isAlert ? <AlertIcon className="w-5 h-5" /> : <ChatIcon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {activity.seniorName}
          </span>
          {isAlert && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--error)', color: 'white' }}>
              Alert
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {timeAgo}
          </span>
        </div>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
          {activity.content}
        </p>
        {activity.scamProbability !== undefined && activity.scamProbability > 0.5 && (
          <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
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
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ChatIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className || "w-5 h-5"} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
