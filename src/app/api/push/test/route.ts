import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
const webpush = require('web-push')

export async function POST() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscriptions
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)

    if (!subscriptions?.length) {
        return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }

    webpush.setVapidDetails(
        'mailto:test@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )

    const results = await Promise.all(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, JSON.stringify({
                title: 'Test Notificatie',
                body: 'Dit is een testbericht vanuit de server!',
            }))
            return { success: true }
        } catch (error) {
            console.error('Error sending push:', error)
            return { success: false, error }
        }
    }))

    return NextResponse.json({ results })
}
