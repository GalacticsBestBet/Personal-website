const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
    console.log('--- 1. Seeding Test Task ---')
    // Get a user ID first (any user)
    const { data: users } = await supabase.auth.admin.listUsers()
    if (!users?.users?.length) {
        console.error('No users found.')
        return
    }
    const userId = users.users[0].id

    const now = new Date()
    // Due 1 minute ago
    const due = new Date(now.getTime() - 60000).toISOString()

    const { data: task, error } = await supabase
        .from('items')
        .insert({
            content: `Manual Test Notification ${now.toLocaleTimeString()}`,
            type: 'TASK',
            status: 'OPEN',
            reminder_sent: false,
            notify_at: due,
            user_id: userId
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating task:', error)
        return
    }
    console.log(`✅ Created task: "${task.content}" (ID: ${task.id})`)

    console.log('\n--- 2. Triggering Cron Job ---')
    try {
        const response = await fetch('http://localhost:3000/api/cron/reminders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.CRON_SECRET || 'dev_secret'}`
            }
        });
        const result = await response.json();
        console.log('✅ Cron Result:', JSON.stringify(result, null, 2));

        if (result.processed > 0) {
            console.log('\n🎉 SUCCESS! You should see a notification now.')
        } else {
            console.log('\n⚠️ No notifications sent. Is your browser open and subscribed?')
        }
    } catch (e) {
        console.error('❌ Failed to call cron API:', e.message)
    }
}

test()
