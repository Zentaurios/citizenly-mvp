-- Citizenly Database Schema - Supabase Compatible Version
-- Version: 1.1 (Supabase RLS Compatible)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS helper functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql STABLE 
AS $function$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;

-- Users table (compatible with Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255), -- Optional if using Supabase Auth
    role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'politician', 'admin')),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": true}',
    interests TEXT[] DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(500),
    password_reset_token VARCHAR(500),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Supabase Auth Integration
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for auth_user_id
CREATE UNIQUE INDEX idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Rest of tables remain the same...
-- [Previous schema content for addresses, politicians, etc.]

-- Updated RLS Policies for Supabase Auth

-- Drop existing policies
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS addresses_own_data ON addresses;
DROP POLICY IF EXISTS politicians_own_data ON politicians;
DROP POLICY IF EXISTS politicians_public_read ON politicians;
DROP POLICY IF EXISTS verification_attempts_own_data ON verification_attempts;
DROP POLICY IF EXISTS sessions_own_data ON sessions;
DROP POLICY IF EXISTS polls_politician_manage ON polls;
DROP POLICY IF EXISTS polls_public_read ON polls;
DROP POLICY IF EXISTS poll_responses_own_data ON poll_responses;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- New RLS Policies for Supabase Auth

-- Users: Can access own data, admins can access all
CREATE POLICY "Users can view own data" ON users FOR SELECT 
USING (
  auth.uid() = auth_user_id OR 
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update own data" ON users FOR UPDATE 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own data" ON users FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL 
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Politicians: Can manage own data, public can view verified politicians
CREATE POLICY "Politicians can manage own data" ON politicians FOR ALL 
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Public can view verified politicians" ON politicians FOR SELECT 
USING (
  is_verified = true AND 
  EXISTS (SELECT 1 FROM users WHERE id = politicians.user_id AND verification_status = 'verified')
);

-- Verification attempts: Users can manage their own
CREATE POLICY "Users can manage own verification attempts" ON verification_attempts FOR ALL 
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Sessions: Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON sessions FOR ALL 
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Polls: Politicians can manage their own, public can view active
CREATE POLICY "Politicians can manage own polls" ON polls FOR ALL 
USING (
  politician_id IN (
    SELECT p.id FROM politicians p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Public can view active polls" ON polls FOR SELECT 
USING (is_active = true);

-- Poll responses: Users can manage their own
CREATE POLICY "Users can manage own poll responses" ON poll_responses FOR ALL 
USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Functions for Supabase integration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, first_name, last_name, date_of_birth, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    COALESCE((NEW.raw_user_meta_data ->> 'date_of_birth')::date, CURRENT_DATE - INTERVAL '18 years'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Helper function to get current user
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM users WHERE auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert admin user (update this with your actual auth user ID after creating admin in Supabase Auth)
-- INSERT INTO users (auth_user_id, email, first_name, last_name, date_of_birth, role, verification_status, email_verified, is_active) 
-- VALUES (
--   'your-admin-auth-uuid-here',
--   'admin@citizenly.com', 
--   'Admin', 
--   'User', 
--   '1980-01-01', 
--   'admin', 
--   'verified', 
--   true, 
--   true
-- );

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth users';
COMMENT ON COLUMN users.auth_user_id IS 'Links to auth.users.id from Supabase Auth';
COMMENT ON COLUMN users.password_hash IS 'Optional - not needed if using Supabase Auth';
