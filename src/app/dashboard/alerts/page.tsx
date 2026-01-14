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
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 rounded-full animate-spin"
               style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading alerts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 dash-stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Security Alerts
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Review potential scam detections and suspicious activity
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="dash-tabs">
          <button
            onClick={() => setFilter('unread')}
            className={`dash-tab ${filter === 'unread' ? 'dash-tab-active' : ''}`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`dash-tab ${filter === 'all' ? 'dash-tab-active' : ''}`}
          >
            All
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="dash-card">
          <div className="dash-empty">
            <div className="dash-empty-icon" style={{
              background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
            }}>
              <CheckIcon className="w-7 h-7" style={{ color: 'var(--success)' }} />
            </div>
            <p className="dash-empty-title">
              {filter === 'unread' ? 'All clear!' : 'No alerts yet'}
            </p>
            <p className="dash-empty-desc">
              {filter === 'unread'
                ? 'All alerts have been reviewed. Great job keeping your family safe.'
                : 'Alerts will appear here when potential scams are detected.'}
            </p>
          </div>
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

  const severityConfig = {
    high: {
      bg: 'var(--error)',
      badge: 'dash-badge-error',
      border: 'rgba(248, 113, 113, 0.3)',
    },
    medium: {
      bg: 'var(--amber-glow)',
      badge: 'dash-badge-warning',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    low: {
      bg: 'var(--bg-elevated)',
      badge: 'dash-badge-muted',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  }

  const config = severityConfig[severity]

  return (
    <div className="dash-card dash-card-hover"
         style={!alert.acknowledged ? { border: `1px solid ${config.border}` } : {}}>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Severity Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{
                 background: config.bg,
                 color: severity === 'low' ? 'var(--text-secondary)' : 'white',
               }}>
            <AlertIcon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {alert.seniorName}
              </span>
              <span className={`dash-badge ${config.badge}`}>
                {Math.round(alert.scamProbability * 100)}% risk
              </span>
              {!alert.acknowledged && (
                <span className="dash-badge dash-badge-error">New</span>
              )}
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {alert.aiAnalysis}
            </p>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Actions */}
          {!alert.acknowledged && (
            <button
              onClick={onAcknowledge}
              className="dash-btn dash-btn-secondary flex-shrink-0"
            >
              Mark as Read
            </button>
          )}
        </div>

        {/* Image Preview */}
        {alert.imageUrl && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
              Scanned Image
            </p>
            <img
              src={alert.imageUrl}
              alt="Scanned content"
              className="max-h-48 rounded-lg"
              style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
