-- Citizenly Test Users for MVP Demo
-- Run this in Supabase Dashboard → SQL Editor after running the main schema

-- Insert test users for MVP demo
INSERT INTO users (
  id,
  email, 
  first_name, 
  last_name, 
  date_of_birth, 
  role, 
  verification_status, 
  email_verified, 
  is_active,
  created_at,
  updated_at
) VALUES 
-- Test Citizen User
(
  uuid_generate_v4(),
  'citizen@user.com',
  'Test',
  'Citizen',
  '1990-01-01',
  'citizen',
  'verified',
  true,
  true,
  NOW(),
  NOW()
),
-- Test Politician User  
(
  uuid_generate_v4(),
  'politician@user.com',
  'Test',
  'Politician', 
  '1980-01-01',
  'politician',
  'verified',
  true,
  true,
  NOW(),
  NOW()
),
-- Test Admin User
(
  uuid_generate_v4(),
  'admin@user.com',
  'Test',
  'Admin',
  '1975-01-01', 
  'admin',
  'verified',
  true,
  true,
  NOW(),
  NOW()
);

-- Create test addresses for users
INSERT INTO addresses (
  user_id,
  address_line_1,
  city,
  state,
  zip_code,
  is_primary,
  verification_status,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  '123 Main Street',
  'Anytown',
  'CA',
  '90210',
  true,
  'verified',
  NOW(),
  NOW()
FROM users u 
WHERE u.email IN ('citizen@user.com', 'politician@user.com', 'admin@user.com');

-- Create politician profile for politician user
INSERT INTO politicians (
  user_id,
  office_title,
  office_level,
  district,
  party_affiliation,
  term_start,
  term_end,
  office_phone,
  office_email,
  bio,
  is_verified,
  is_active,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'City Council Member',
  'city',
  'District 1',
  'Independent',
  '2024-01-01',
  '2026-12-31',
  '(555) 123-4567',
  'politician@user.com',
  'Test politician profile for MVP demonstration.',
  true,
  true,
  NOW(),
  NOW()
FROM users u 
WHERE u.email = 'politician@user.com';

-- Create a sample poll for the politician
INSERT INTO polls (
  politician_id,
  title,
  description,
  poll_type,
  options,
  is_active,
  start_date,
  end_date,
  visibility,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'Community Budget Priorities',
  'What should be our top priority for the community budget this year?',
  'multiple_choice',
  '[
    {"id": 1, "text": "Infrastructure improvements"},
    {"id": 2, "text": "Education funding"},
    {"id": 3, "text": "Public safety"},
    {"id": 4, "text": "Environmental initiatives"}
  ]'::jsonb,
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  'public',
  NOW(),
  NOW()
FROM politicians p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'politician@user.com';

-- Verification logs for test users
INSERT INTO verification_logs (
  user_id,
  verification_type,
  verification_method,
  status,
  verification_data,
  created_at,
  completed_at
)
SELECT 
  u.id,
  'identity',
  'manual_verification',
  'completed',
  '{"verified_by": "system", "reason": "test_user"}'::jsonb,
  NOW(),
  NOW()
FROM users u 
WHERE u.email IN ('citizen@user.com', 'politician@user.com', 'admin@user.com');

-- Set password hashes for test users (password: "password123")
-- Note: This is a bcrypt hash of "password123" for testing purposes
-- In production, passwords would be set through proper auth flow
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeA/Lx4kQzJG2Jx8K'
WHERE email IN ('citizen@user.com', 'politician@user.com', 'admin@user.com');

-- Display created test users
SELECT 
  email,
  first_name,
  last_name,
  role,
  verification_status,
  is_active,
  created_at
FROM users 
WHERE email IN ('citizen@user.com', 'politician@user.com', 'admin@user.com')
ORDER BY role;
