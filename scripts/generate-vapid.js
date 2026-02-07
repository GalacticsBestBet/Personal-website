const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

const envPath = path.join(__dirname, '..', '.env.local');

fs.appendFileSync(envPath, envContent);

console.log('VAPID keys appended to .env.local');
console.log('Public Key:', vapidKeys.publicKey);
