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

    // Use Service Role to bypass RLS for Cron Jobs
    const supabase = await createClient()

    // Note: createClient from @/lib/supabase/server uses cookies/headers.
    // For cron, we might need a direct client if RLS blocks 'anon'.
    // However, if we don't have a service role client helper, we can try to debug if RLS is the issue.
    // Actually, usually we need createServerClient with service role key for cron.
    // Let's assume for now we stick to standard but if it returns 0 it suggests RLS.
    // Let's try to verify if we can fetch *anything*.

    // FIX: We need a client that ignores RLS or simulates a user.
    // Since we don't have a separate service-client helper file yet, 
    // let's try to see if we can just use the standard one but logged out.
    // If RLS is "Users can only see their own items", then 'anon' sees nothing.

    // We need to use process.env.SUPABASE_SERVICE_ROLE_KEY
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    const serviceClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 2. Find tasks due soon (e.g. today or overdue) that haven't been notified
    const now = new Date().toISOString()
    const { data: tasks, error } = await serviceClient
        .from('items')
        .select(`
            id, 
            content, 
            user_id
        `)
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .eq('reminder_sent', false)
        .lt('notify_at', now) // Check notify_at (which includes offset)
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
            const { data: subscriptions } = await serviceClient
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', task.user_id)

            if (!subscriptions?.length) continue

            // Send notification
            const notificationPayload = JSON.stringify({
                title: 'Taak Herinnering ⏰',
                body: `Vergeet niet: "${task.content}"`,
                icon: '/icon.svg'
            })

            const taskResults = await Promise.all(subscriptions.map(async (sub: { endpoint: string, p256dh: string, auth: string }) => {
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
            await serviceClient
                .from('items')
                .update({ reminder_sent: true })
                .eq('id', task.id)

            results.push({ taskId: task.id, sent: taskResults })
        }
    }

    // 5. Find stale inbox items (older than 2 hours)
    const thresholdTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: inboxItems } = await serviceClient
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
        inboxItems.forEach((item: { user_id: string, id: string }) => {
            if (!inboxByUser[item.user_id]) inboxByUser[item.user_id] = []
            inboxByUser[item.user_id].push(item.id)
        })
    }

    // Process Inbox Nudges
    for (const [userId, itemIds] of Object.entries(inboxByUser)) {
        const { data: subscriptions } = await serviceClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)

        if (!subscriptions?.length) continue

        const count = itemIds.length
        const notificationPayload = JSON.stringify({
            title: 'Inbox Opruimen 🧹',
            body: `Je hebt ${count} item${count > 1 ? 's' : ''} die wachten op actie.`,
            icon: '/icon.svg'
        })

        await Promise.all(subscriptions.map(async (sub: { endpoint: string, p256dh: string, auth: string }) => {
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
        await serviceClient
            .from('items')
            .update({ reminder_sent: true })
            .in('id', itemIds)

        results.push({ type: 'inbox_nudge', userId, count })
    }

    return NextResponse.json({ processed: results.length, details: results })
}
