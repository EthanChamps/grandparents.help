'use client'

import { useEffect, useState } from 'react'

interface Alert {
  id: string
  type: string
  seniorName: string
  scamProbability: number
  aiAnalysis: string
  imageUrl?: string
  acknowledged: boolean
  createdAt: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/dashboard/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/dashboard/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      )
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const filteredAlerts = filter === 'unread'
    ? alerts.filter((a) => !a.acknowledged)
    : alerts

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
            Security Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review potential scam detections and suspicious activity
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          <button
            onClick={() => setFilter('unread')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: filter === 'unread' ? 'var(--amber-glow)' : 'transparent',
              color: filter === 'unread' ? 'var(--bg-deep)' : 'var(--text-secondary)',
            }}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: filter === 'all' ? 'var(--amber-glow)' : 'transparent',
              color: filter === 'all' ? 'var(--bg-deep)' : 'var(--text-secondary)',
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
               style={{ background: 'var(--success)', opacity: 0.2 }}>
            <CheckIcon className="w-8 h-8" style={{ color: 'var(--success)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {filter === 'unread' ? 'No unread alerts' : 'No alerts yet'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filter === 'unread'
              ? 'All alerts have been reviewed'
              : 'Alerts will appear when potential scams are detected'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertCard({
  alert,
  onAcknowledge,
}: {
  alert: Alert
  onAcknowledge: () => void
}) {
  const date = new Date(alert.createdAt)
  const severity = alert.scamProbability >= 0.9 ? 'high' : alert.scamProbability >= 0.7 ? 'medium' : 'low'

  const severityColors = {
    high: { bg: 'var(--error)', text: 'white' },
    medium: { bg: 'var(--amber-glow)', text: 'var(--bg-deep)' },
    low: { bg: 'var(--text-muted)', text: 'white' },
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: !alert.acknowledged ? '2px solid var(--error)' : 'none',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Severity Badge */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: severityColors[severity].bg }}
          >
            <AlertIcon className="w-6 h-6" style={{ color: severityColors[severity].text }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {alert.seniorName}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: severityColors[severity].bg, color: severityColors[severity].text }}
              >
                {Math.round(alert.scamProbability * 100)}% probability
              </span>
              {!alert.acknowledged && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--error)', color: 'white' }}>
                  New
                </span>
              )}
            </div>

            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {alert.aiAnalysis}
            </p>

            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
            </p>
          </div>

          {/* Actions */}
          {!alert.acknowledged && (
            <button
              onClick={onAcknowledge}
              className="px-4 py-2 rounded-lg text-sm font-medium shrink-0"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              Mark as Read
            </button>
          )}
        </div>

        {/* Image Preview */}
        {alert.imageUrl && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Scanned Image:
            </p>
            <img
              src={alert.imageUrl}
              alt="Scanned content"
              className="max-h-48 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AlertIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
