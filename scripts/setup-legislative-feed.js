#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏛️  Citizenly Legislative Feed Setup\n');

// Check for environment variables
const envFile = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envFile);

console.log('📋 Setup Checklist:\n');

// 1. Database
console.log('1. Database Schema:');
if (process.env.DATABASE_URL || process.env.SUPABASE_URL) {
  console.log('   ✅ Database connection configured');
  console.log('   📝 Run the legislative schema SQL manually in your database:');
  console.log('      - Open your database console (Supabase SQL Editor or PostgreSQL)');
  console.log('      - Execute the contents of: database/legislative-feed-schema.sql');
} else {
  console.log('   ❌ No database connection found');
  console.log('   📝 Set DATABASE_URL or configure Supabase connection');
}

// 2. Environment Variables
console.log('\n2. Environment Variables:');
const requiredEnvVars = [
  { key: 'LEGISCAN_API_KEY', desc: 'LegiScan API key from legiscan.com' },
  { key: 'UPSTASH_REDIS_REST_URL', desc: 'Upstash Redis REST URL' },
  { key: 'UPSTASH_REDIS_REST_TOKEN', desc: 'Upstash Redis REST token' },
  { key: 'CRON_SECRET', desc: 'Secret for cron job authentication' }
];

requiredEnvVars.forEach(({ key, desc }) => {
  if (process.env[key]) {
    console.log(`   ✅ ${key}: Set`);
  } else {
    console.log(`   ❌ ${key}: Not set`);
    console.log(`      📝 ${desc}`);
  }
});

// 3. Instructions
console.log('\n📚 Setup Instructions:\n');

console.log('🔑 1. Get API Keys:');
console.log('   • LegiScan API: https://legiscan.com/legiscan (Public tier: 30k queries/month)');
console.log('   • Upstash Redis: https://upstash.com/ (Free tier available)');

console.log('\n📊 2. Set up Database:');
console.log('   • Copy contents of database/legislative-feed-schema.sql');
console.log('   • Paste into your database console (Supabase SQL Editor)');
console.log('   • Execute to create the legislative tables');

console.log('\n⚙️  3. Environment Variables:');
console.log('   Add to your .env.local file:');
console.log('   ```');
console.log('   LEGISCAN_API_KEY="your_legiscan_api_key"');
console.log('   UPSTASH_REDIS_REST_URL="your_upstash_redis_url"');
console.log('   UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"');
console.log('   CRON_SECRET="your_secure_random_string"');
console.log('   ```');

console.log('\n🧪 4. Test the Feature:');
console.log('   • Restart your development server: npm run dev');
console.log('   • Login as a verified Nevada user');
console.log('   • Visit /legislative to see the feed');
console.log('   • Test manual sync: POST /api/cron/sync-bills');

console.log('\n🚀 5. Production Deployment:');
console.log('   • Add environment variables to Vercel');
console.log('   • Deploy - cron jobs will automatically run every 4 hours');
console.log('   • Monitor sync at /api/legislative/sync');

console.log('\n📖 For detailed documentation, see: LEGISLATIVE_FEED_README.md\n');

// Check if schema file exists
const schemaPath = path.join(__dirname, '..', 'database', 'legislative-feed-schema.sql');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Legislative schema file found: database/legislative-feed-schema.sql');
} else {
  console.log('❌ Legislative schema file missing');
}

console.log('\n🎉 Once setup is complete, your users will have access to:');
console.log('   • Personalized Nevada legislative updates');
console.log('   • Real-time bill tracking and vote results');
console.log('   • Filtering by district and interests');
console.log('   • Mobile-responsive feed interface\n');