'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    urlBase64ToUint8Array,
    registerServiceWorker,
    subscribeToPush,
    unsubscribeFromPush
} from '@/lib/push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isPending, setIsPending] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()

            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(setSubscription)
            })
        }
    }, [])

    const handleSubscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key not found')
            return
        }
        setIsPending(true)
        try {
            const sub = await subscribeToPush(VAPID_PUBLIC_KEY)
            setSubscription(sub)

            // Save to backend
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            })

            new Notification("Notificaties actief!", {
                body: "Je ontvangt nu reminders van je externe brein.",
                icon: "/icon.svg"
            })
        } catch (error) {
            console.error('Failed to subscribe:', error)
            alert('Kon notificaties niet activeren.')
        } finally {
            setIsPending(false)
        }
    }

    if (!isSupported) return null

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSubscribe}
            disabled={!!subscription || isPending}
            className="gap-2"
        >
            {subscription ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {subscription ? 'Notificaties Aan' : 'Zet Notificaties Aan'}
        </Button>
    )
}
