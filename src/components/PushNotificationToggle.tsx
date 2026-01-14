'use client'

import { useState, useEffect } from 'react'

export function PushNotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check if already subscribed
    checkSubscription()
  }, [])

  async function checkSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in your browser')
      return
    }

    setLoading(true)

    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      // Get VAPID public key
      const keyResponse = await fetch('/api/push/vapid-key')
      const { vapidKey } = await keyResponse.json()

      if (!vapidKey) {
        throw new Error('Push notifications not configured')
      }

      // Subscribe
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      setSubscribed(true)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        // Unsubscribe locally
        await subscription.unsubscribe()
      }

      setSubscribed(false)
    } catch (error) {
      console.error('Unsubscribe error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show on unsupported browsers
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  if (permission === 'denied') {
    return (
      <div className="notification-toggle disabled">
        <span className="icon">🔕</span>
        <span className="label">Notifications blocked</span>
        <span className="hint">Enable in browser settings</span>
      </div>
    )
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`notification-toggle ${subscribed ? 'active' : ''}`}
    >
      <span className="icon">{subscribed ? '🔔' : '🔕'}</span>
      <span className="label">
        {loading ? 'Loading...' : subscribed ? 'Notifications on' : 'Enable notifications'}
      </span>
    </button>
  )
}

// Helper function to convert base64 VAPID key
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
