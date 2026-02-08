const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local
try {
    const envConfig = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8')
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, ...value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '') // remove quotes
        }
    })
} catch (e) {
    console.error('Error loading .env.local', e)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugCron() {
    const now = new Date().toISOString()
    console.log('Current Time (ISO):', now)

    // 1. Run the EXACT query from the route
    const { data: pickedUp, error: pickedUpError } = await supabase
        .from('items')
        .select('id, content, notify_at, due_date, reminder_sent')
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .eq('reminder_sent', false)
        .or(`notify_at.lt.${now},and(notify_at.is.null,due_date.lt.${now})`)

    if (pickedUpError) console.error('Error fetching picked up tasks:', pickedUpError)

    console.log(`\n\n--- TASKS PICKED UP BY CRON (${pickedUp?.length || 0}) ---`)
    pickedUp?.forEach(t => console.log(`[YES] ${t.content} (Due: ${t.due_date}, Notify: ${t.notify_at})`))

    // 2. Fetch ALL open tasks to see why others are missed
    const { data: allTasks, error: allError } = await supabase
        .from('items')
        .select('id, content, notify_at, due_date, reminder_sent')
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(20)

    if (allError) {
        console.error('Error fetching all tasks:', allError)
        return
    }

    console.log('\n\n--- RECENT OPEN TASKS ANALYSIS ---')
    allTasks.forEach(t => {
        const isPicked = pickedUp?.find(p => p.id === t.id)
        if (isPicked) return // Already logged above

        console.log(`[NO ] ${t.content}`)
        console.log(`      ID: ${t.id}`)
        console.log(`      Due: ${t.due_date}`)
        console.log(`      Notify: ${t.notify_at}`)
        console.log(`      Sent: ${t.reminder_sent}`)

        // Analyze why
        if (t.reminder_sent) console.log('      -> Reason: Already sent')
        else {
            const duePassed = t.due_date && t.due_date < now
            const notifyPassed = t.notify_at && t.notify_at < now

            if (t.notify_at) {
                if (!notifyPassed) console.log('      -> Reason: notify_at is in the future')
            } else if (t.due_date) {
                if (!duePassed) console.log('      -> Reason: notify_at is null AND due_date is in the future')
            } else {
                console.log('      -> Reason: No due_date or notify_at')
            }
        }
        console.log('')
    })
}

debugCron()
