'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'

interface NotificationSettings {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  alertThreshold: 'all' | 'high' | 'critical'
}

// Helper to convert base64 VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [pushSubscribed, setPushSubscribed] = useState(false)

  const [settings, setSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    alertThreshold: 'high',
  })

  // Check push subscription status
  const checkPushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      if ('Notification' in window) {
        setPushPermission(Notification.permission)
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setPushSubscribed(!!subscription)
    } catch (err) {
      console.error('Error checking push subscription:', err)
    }
  }, [])

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
    checkPushSubscription()
  }, [checkPushSubscription])

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

  // Handle push notification toggle
  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications are not supported in your browser')
      return
    }

    if (pushSubscribed) {
      // Unsubscribe
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })
          await subscription.unsubscribe()
        }
        setPushSubscribed(false)
        setSettings(prev => ({ ...prev, pushNotifications: false }))
      } catch (err) {
        console.error('Unsubscribe error:', err)
        setError('Failed to disable notifications')
      }
    } else {
      // Subscribe
      try {
        const perm = await Notification.requestPermission()
        setPushPermission(perm)

        if (perm !== 'granted') {
          setError('Permission denied. Please enable notifications in browser settings.')
          return
        }

        const keyResponse = await fetch('/api/push/vapid-key')
        const { vapidKey } = await keyResponse.json()

        if (!vapidKey) {
          setError('Push notifications not configured on server')
          return
        }

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })

        setPushSubscribed(true)
        setSettings(prev => ({ ...prev, pushNotifications: true }))
      } catch (err) {
        console.error('Subscribe error:', err)
        setError('Failed to enable notifications')
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 dash-stagger">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage notifications and account
        </p>
      </div>

      {/* Account Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
            Account
          </h2>
        </div>
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Email</p>
              <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="dash-divider" />
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Name</p>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {session?.user?.name || 'Not set'}
              </p>
            </div>
            <button className="dash-btn dash-btn-ghost flex-shrink-0">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h2>
        </div>
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
          <ToggleSetting
            label="Email Alerts"
            description="Receive alerts via email"
            enabled={settings.emailAlerts}
            onToggle={() => toggleSetting('emailAlerts')}
          />
          <div className="dash-divider" />
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {pushPermission === 'denied'
                  ? 'Blocked in browser'
                  : pushSubscribed
                    ? 'Enabled for scam alerts'
                    : 'Push alerts for urgent issues'
                }
              </p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushPermission === 'denied'}
              className={`dash-toggle ${pushSubscribed ? 'dash-toggle-on' : 'dash-toggle-off'} flex-shrink-0`}
              role="switch"
              aria-checked={pushSubscribed}
              style={pushPermission === 'denied' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <div
                className="dash-toggle-knob"
                style={{ left: pushSubscribed ? '22px' : '2px' }}
              />
            </button>
          </div>
          <div className="dash-divider" />
          <ToggleSetting
            label="SMS Alerts"
            description="Text alerts for critical scams"
            enabled={settings.smsAlerts}
            onToggle={() => toggleSetting('smsAlerts')}
          />

          <div className="dash-divider" />

          <div>
            <p className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1" style={{ color: 'var(--text-primary)' }}>
              Alert Sensitivity
            </p>
            <p className="text-xs sm:text-sm mb-2 sm:mb-4" style={{ color: 'var(--text-muted)' }}>
              Choose which alerts trigger notifications
            </p>
            <div className="dash-tabs flex-wrap" style={{ display: 'inline-flex' }}>
              {(['all', 'high', 'critical'] as const).map((threshold) => (
                <button
                  key={threshold}
                  onClick={() => setSettings((prev) => ({ ...prev, alertThreshold: threshold }))}
                  className={`dash-tab ${settings.alertThreshold === threshold ? 'dash-tab-active' : ''}`}
                >
                  {threshold === 'all' ? 'All' : threshold === 'high' ? 'High' : 'Critical'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="dash-card">
        <div className="dash-section-header">
          <h2 className="font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
            Subscription
          </h2>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Current Plan</p>
                <span className="dash-badge dash-badge-success">Active</span>
              </div>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Free Trial
              </p>
            </div>
            <button className="dash-btn dash-btn-primary w-full sm:w-auto">
              Upgrade
            </button>
          </div>
          <p className="text-xs mt-3 sm:mt-4" style={{ color: 'var(--text-muted)' }}>
            Billing management coming soon
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="dash-btn dash-btn-primary w-full sm:w-auto"
          style={{ padding: '0.75rem 1.5rem', minHeight: '48px' }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-xs sm:text-sm font-medium text-center sm:text-left" style={{ color: 'var(--success)' }}>
            Settings saved!
          </span>
        )}
        {error && (
          <span className="text-xs sm:text-sm font-medium text-center sm:text-left" style={{ color: 'var(--error)' }}>
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
    <div className="flex items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <p className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`dash-toggle ${enabled ? 'dash-toggle-on' : 'dash-toggle-off'} flex-shrink-0`}
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
