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

    // 2. Find tasks due soon OR tasks without due date that need a reminder (every 24h)
    const now = new Date()
    const nowISO = now.toISOString()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Find due tasks OR undated tasks needing reminder
    const { data: tasks, error } = await serviceClient
        .from('items')
        .select(`
            id, 
            content, 
            user_id
        `)
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .or(`notify_at.lt.${nowISO},and(notify_at.is.null,due_date.lt.${nowISO}),and(due_date.is.null,or(last_reminded_at.lt.${twentyFourHoursAgo},last_reminded_at.is.null))`)
    // Logic:
    // 1. Explicit notify_at is passed
    // 2. OR No notify_at AND due_date is passed (overdue)
    // 3. OR No due_date AND (last_reminded_at is > 24h ago OR null) -> Recurring 24h for undated

    // Note: The above OR condition with `and()` syntax in Supabase/PostgREST can be tricky.
    // Let's simplified it by fetching potentially more and filtering in JS if needed,
    // OR constructing the query carefully.
    // The query above tries to do it all in one go.

    // Let's refine the query to be safe:
    // We want:
    // (notify_at < now)
    // OR (notify_at is null AND due_date < now)
    // OR (due_date is null AND (last_reminded_at < 24h_ago OR last_reminded_at is null))

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Filter out tasks that have already been reminded "recently" if they have a due date
    // (The original logic was "reminder_sent = false", but for recurring we might want to check last_reminded_at)
    // For now, let's keep original logic for Due Date tasks (reminder_sent check or similar?)
    // Actually, the user wants recurring for "tasks without a date".
    // For tasks WITH a date, usually it's a one-time reminder unless specified otherwise.
    // The original code used `eq('reminder_sent', false)`.
    // We should probably keep that for dated tasks to avoid spamming?
    // User request: "als ik een taak heb zonder datum dat ik elke 24u een reminder krijg"

    // So for dated tasks: stick to single reminder for now (unless we want to change that too).
    // The query above mixes them. Let's do two queries for clarity or filter in memory.

    // Actually, let's just process the tasks we found.
    // But wait, the original query had `.eq('reminder_sent', false)`.
    // If we remove that, we might spam dated tasks.
    // Let's respect `reminder_sent` for DATED tasks, but ignore it for UNDATED tasks.

    // Refined Strategy:
    // 1. Get Due/Overdue Tasks (Dated) that haven't been sent
    const { data: dueTasks } = await serviceClient
        .from('items')
        .select('id, content, user_id')
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .not('due_date', 'is', null) // Has due date
        .eq('reminder_sent', false)  // Not yet sent
        .or(`notify_at.lt.${nowISO},and(notify_at.is.null,due_date.lt.${nowISO})`)

    // 2. Get Undated Tasks (Every 24h)
    const { data: undatedTasks } = await serviceClient
        .from('items')
        .select('id, content, user_id')
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .is('due_date', null) // No due date
        .or(`last_reminded_at.lt.${twentyFourHoursAgo},last_reminded_at.is.null`)

    const allTasks = [...(dueTasks || []), ...(undatedTasks || [])]

    webpush.setVapidDetails(
        'mailto:admin@externalbrain.app', // Update this
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )

    const results = []

    // 3. Process each task
    if (allTasks?.length) {
        // Dedup by ID just in case
        const uniqueTasks = Array.from(new Map(allTasks.map(item => [item['id'], item])).values());

        for (const task of uniqueTasks) {
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

            // 4. Update reminder status
            // For dated tasks, we might still set reminder_sent = true (to stop spamming)
            // For undated, we update last_reminded_at (and maybe reminder_sent too, doesn't hurt)
            await serviceClient
                .from('items')
                .update({
                    reminder_sent: true,
                    last_reminded_at: nowISO
                })
                .eq('id', task.id)

            results.push({ taskId: task.id, sent: taskResults })
        }
    }

    // 5. Find inbox items (older than 2 hours) need reminder every 2h
    // User request: "bij inbox al de items moeten me meldingen blijven geven om de 2u van zoveel items nog in de inbox"
    // Logic: If items exist in inbox > 2h old, warn every 2h.
    // Trigger condition:
    // (Created > 2h ago AND (last_reminded_at < 2h ago OR last_reminded_at is null))

    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()

    const { data: inboxItems } = await serviceClient
        .from('items')
        .select(`
            id, 
            user_id
        `)
        .eq('type', 'INBOX')
        .eq('status', 'OPEN')
        .lt('created_at', twoHoursAgo) // Created at least 2h ago
        .or(`last_reminded_at.lt.${twoHoursAgo},last_reminded_at.is.null`) // Reminded > 2h ago or never

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

        // Mark as sent / update time
        await serviceClient
            .from('items')
            .update({
                reminder_sent: true,
                last_reminded_at: nowISO
            })
            .in('id', itemIds)

        results.push({ type: 'inbox_nudge', userId, count })
    }

    return NextResponse.json({ processed: results.length, details: results })
}
