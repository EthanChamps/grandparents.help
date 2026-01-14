'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

interface NotificationSettings {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  alertThreshold: 'all' | 'high' | 'critical'
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    alertThreshold: 'high',
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    // TODO: Save settings to database
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your notification preferences and account settings
        </p>
      </div>

      {/* Account Section */}
      <div className="rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Account
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Name</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.name || 'Not set'}
              </p>
            </div>
            <button
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <ToggleSetting
            label="Email Alerts"
            description="Receive alerts via email"
            enabled={settings.emailAlerts}
            onToggle={() => toggleSetting('emailAlerts')}
          />
          <ToggleSetting
            label="Push Notifications"
            description="Browser push notifications for urgent alerts"
            enabled={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <ToggleSetting
            label="SMS Alerts"
            description="Text message alerts for critical scam detections"
            enabled={settings.smsAlerts}
            onToggle={() => toggleSetting('smsAlerts')}
          />

          <div className="pt-4 border-t" style={{ borderColor: 'var(--bg-elevated)' }}>
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Alert Sensitivity
            </p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Choose which alerts to receive notifications for
            </p>
            <div className="flex gap-2">
              {(['all', 'high', 'critical'] as const).map((threshold) => (
                <button
                  key={threshold}
                  onClick={() => setSettings((prev) => ({ ...prev, alertThreshold: threshold }))}
                  className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
                  style={{
                    background: settings.alertThreshold === threshold ? 'var(--amber-glow)' : 'var(--bg-elevated)',
                    color: settings.alertThreshold === threshold ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  }}
                >
                  {threshold === 'all' ? 'All Alerts' : threshold === 'high' ? 'High Risk' : 'Critical Only'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-elevated)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Subscription
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Current Plan</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Free Trial
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
            >
              Upgrade
            </Link>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Billing management coming soon (#11)
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-lg font-medium"
          style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: 'var(--success)' }}>
            Settings saved!
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
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className="relative w-12 h-7 rounded-full transition-colors"
        style={{ background: enabled ? 'var(--amber-glow)' : 'var(--bg-elevated)' }}
      >
        <div
          className="absolute top-1 w-5 h-5 rounded-full transition-transform"
          style={{
            background: 'white',
            left: enabled ? '26px' : '4px',
          }}
        />
      </button>
    </div>
  )
}
