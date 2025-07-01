const bcrypt = require('bcryptjs')

async function generateHashes() {
  console.log('🔐 Generating password hashes...')
  
  // Generate hashes for our test passwords
  const admin123Hash = await bcrypt.hash('admin123', 12)
  const password123Hash = await bcrypt.hash('password123', 12)
  
  console.log('\n📋 Copy/paste this SQL into your database dashboard:')
  console.log('=========================================================')
  console.log(`
-- Update password hashes for test accounts
UPDATE users SET password_hash = '${admin123Hash}' WHERE email = 'admin@citizenly.com';
UPDATE users SET password_hash = '${password123Hash}' WHERE email = 'citizen@test.com';
UPDATE users SET password_hash = '${password123Hash}' WHERE email = 'politician@test.com';

-- Verify the update worked
SELECT email, LEFT(password_hash, 20) as hash_preview FROM users WHERE email IN ('admin@citizenly.com', 'citizen@test.com', 'politician@test.com');
`)
  console.log('=========================================================')
  console.log('\n🧪 Test accounts:')
  console.log('Admin: admin@citizenly.com / admin123')
  console.log('Citizen: citizen@test.com / password123')
  console.log('Politician: politician@test.com / password123')
}

generateHashes().catch(console.error)
