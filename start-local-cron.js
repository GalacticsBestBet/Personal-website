/**
 * Local Cron Scheduler
 * Simulates Vercel Cron by calling the API endpoint every minute.
 * Run this in a separate terminal window: node start-local-cron.js
 */

const fs = require('fs')
const path = require('path')

// Load env vars manually to get CRON_SECRET if needed
const envPath = path.resolve(process.cwd(), '.env.local')
let cronSecret = 'dev_secret'

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && key.trim() === 'CRON_SECRET' && value) {
            cronSecret = value.trim()
        }
    })
}

const CRON_URL = 'http://localhost:3000/api/cron/reminders'

console.log('🚀 Starting Local Cron Scheduler...')
console.log(`Target: ${CRON_URL}`)
console.log('Interval: Every 60 seconds\n')

async function triggerCron() {
    console.log(`[${new Date().toLocaleTimeString()}] ⏰ Triggering cron...`)
    try {
        const response = await fetch(CRON_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cronSecret}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const count = result.processed || 0
            if (count > 0) {
                console.log(`   ✅ Success! Processed ${count} notifications.`)
                console.log('   Details:', JSON.stringify(result.details))
            } else {
                console.log('   💤 No pending notifications found.')
            }
        } else {
            console.error(`   ❌ Failed: ${response.status} ${response.statusText}`)
        }
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        console.log('      (Is your localhost:3000 server running?)')
    }
}

// Trigger immediately on start
triggerCron()

// Then every 60 seconds
setInterval(triggerCron, 60 * 1000)
