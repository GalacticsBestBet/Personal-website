// Native fetch is available in Node 18+ (Next.js 15 requires Node 18+)

// This script simulates the Vercel Cron Job by calling the API endpoint
// Use this for testing locally or if you want to force a check.

async function triggerCron() {
    console.log('⏰ Triggering Cron Job...');
    try {
        const response = await fetch('http://localhost:3000/api/cron/reminders', {
            method: 'GET',
            headers: {
                // Mock authorization if needed, or rely on non-production check
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`
            }
        });

        const data = await response.json();
        console.log('✅ Cron Job Result:', data);
    } catch (error) {
        console.error('❌ Failed to trigger cron:', error.message);
        console.log('Ensure your dev server is running on http://localhost:3000');
    }
}

triggerCron();
