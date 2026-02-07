import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
const webpush = require('web-push')

export async function GET(request: Request) {
    // 1. Check for Cron Secret (security)
    // Only enforce in production
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 2. Find tasks due soon (e.g. today or overdue) that haven't been notified
    const now = new Date().toISOString()
    const { data: tasks, error } = await supabase
        .from('items')
        .select(`
            id, 
            content, 
            user_id,
            profiles!inner(email)
        `)
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .eq('reminder_sent', false)
        .lt('due_date', now) // Or logic for "due within 1 hour"
    // For simple MVP: "due in the past" means "overdue/due now"

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })



    webpush.setVapidDetails(
        'mailto:admin@externalbrain.app', // Update this
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )

    const results = []

    // 3. Process each task
    if (tasks?.length) {
        for (const task of tasks) {
            // Get user's subscriptions
            const { data: subscriptions } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', task.user_id)

            if (!subscriptions?.length) continue

            // Send notification
            const notificationPayload = JSON.stringify({
                title: 'Taak Herinnering ⏰',
                body: `Vergeet niet: "${task.content}"`,
                icon: '/icon-192x192.png'
            })

            const taskResults = await Promise.all(subscriptions.map(async sub => {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                        notificationPayload
                    )
                    return { success: true }
                } catch (e) {
                    console.error('Push failed', e)
                    return { success: false }
                }
            }))

            // 4. Mark as sent if at least one push succeeded (or just mark it to avoid infinite loops)
            await supabase
                .from('items')
                .update({ reminder_sent: true })
                .eq('id', task.id)

            results.push({ taskId: task.id, sent: taskResults })
        }
    }

    // 5. Find stale inbox items (older than 2 hours)
    const thresholdTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: inboxItems } = await supabase
        .from('items')
        .select(`
            id, 
            user_id
        `)
        .eq('type', 'INBOX')
        .eq('status', 'OPEN')
        .eq('reminder_sent', false)
        .lt('created_at', thresholdTime)

    // Group inbox items by user
    const inboxByUser: Record<string, string[]> = {}
    if (inboxItems?.length) {
        inboxItems.forEach(item => {
            if (!inboxByUser[item.user_id]) inboxByUser[item.user_id] = []
            inboxByUser[item.user_id].push(item.id)
        })
    }

    // Process Inbox Nudges
    for (const [userId, itemIds] of Object.entries(inboxByUser)) {
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)

        if (!subscriptions?.length) continue

        const count = itemIds.length
        const notificationPayload = JSON.stringify({
            title: 'Inbox Opruimen 🧹',
            body: `Je hebt ${count} item${count > 1 ? 's' : ''} die wachten op actie.`,
            icon: '/icon-192x192.png'
        })

        await Promise.all(subscriptions.map(async sub => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, notificationPayload)
            } catch (e) {
                console.error('Inbox push failed', e)
            }
        }))

        // Mark as sent
        await supabase
            .from('items')
            .update({ reminder_sent: true })
            .in('id', itemIds)

        results.push({ type: 'inbox_nudge', userId, count })
    }

    return NextResponse.json({ processed: results.length, details: results })
}
