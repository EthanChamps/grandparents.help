'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'

interface NotificationSettings {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  alertThreshold: 'all' | 'high' | 'critical'
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [settings, setSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    alertThreshold: 'high',
  })

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/dashboard/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          emailAlerts: data.emailAlerts ?? true,
          pushNotifications: data.pushNotifications ?? true,
          smsAlerts: data.smsAlerts ?? false,
          alertThreshold: data.alertThreshold ?? 'high',
        })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)
    setError('')

    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        throw new Error('Failed to save settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 dash-stagger">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage your notification preferences and account
        </p>
      </div>

      {/* Account Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Account
          </h2>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Email</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="dash-divider" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Name</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.name || 'Not set'}
              </p>
            </div>
            <button className="dash-btn dash-btn-ghost">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h2>
        </div>
        <div className="p-5 space-y-5">
          <ToggleSetting
            label="Email Alerts"
            description="Receive alerts via email"
            enabled={settings.emailAlerts}
            onToggle={() => toggleSetting('emailAlerts')}
          />
          <div className="dash-divider" />
          <ToggleSetting
            label="Push Notifications"
            description="Browser push notifications for urgent alerts"
            enabled={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <div className="dash-divider" />
          <ToggleSetting
            label="SMS Alerts"
            description="Text message alerts for critical scam detections"
            enabled={settings.smsAlerts}
            onToggle={() => toggleSetting('smsAlerts')}
          />

          <div className="dash-divider" />

          <div>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Alert Sensitivity
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Choose which alerts trigger notifications
            </p>
            <div className="dash-tabs" style={{ display: 'inline-flex' }}>
              {(['all', 'high', 'critical'] as const).map((threshold) => (
                <button
                  key={threshold}
                  onClick={() => setSettings((prev) => ({ ...prev, alertThreshold: threshold }))}
                  className={`dash-tab ${settings.alertThreshold === threshold ? 'dash-tab-active' : ''}`}
                >
                  {threshold === 'all' ? 'All Alerts' : threshold === 'high' ? 'High Risk' : 'Critical Only'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Subscription
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Current Plan</p>
                <span className="dash-badge dash-badge-success">Active</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Free Trial
              </p>
            </div>
            <button className="dash-btn dash-btn-primary">
              Upgrade
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Billing management coming soon
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="dash-btn dash-btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
            Settings saved!
          </span>
        )}
        {error && (
          <span className="text-sm font-medium" style={{ color: 'var(--error)' }}>
            {error}
          </span>
        )}
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`dash-toggle ${enabled ? 'dash-toggle-on' : 'dash-toggle-off'}`}
        role="switch"
        aria-checked={enabled}
      >
        <div
          className="dash-toggle-knob"
          style={{ left: enabled ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}
