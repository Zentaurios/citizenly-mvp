-- Citizenly Database Schema - Basic Tables for Supabase
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension (may already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (compatible with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255), -- For test users (not needed if using Supabase Auth)
    role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'politician', 'admin')),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": true}',
    interests TEXT[] DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Supabase Auth Integration
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'United States',
    district VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_method VARCHAR(50),
    verification_data JSONB,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Politicians table
CREATE TABLE IF NOT EXISTS politicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    office_title VARCHAR(100) NOT NULL,
    office_level VARCHAR(20) NOT NULL CHECK (office_level IN ('federal', 'state', 'county', 'city', 'local')),
    district VARCHAR(100),
    party_affiliation VARCHAR(50),
    term_start DATE,
    term_end DATE,
    office_phone VARCHAR(20),
    office_email VARCHAR(255),
    office_address TEXT,
    website_url VARCHAR(500),
    bio TEXT,
    photo_url VARCHAR(500),
    social_media JSONB DEFAULT '{}',
    verification_documents JSONB DEFAULT '[]',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poll_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice' CHECK (poll_type IN ('multiple_choice', 'yes_no', 'rating', 'open_ended')),
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    target_demographics JSONB DEFAULT '{}',
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'district', 'private')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one response per user per poll
    UNIQUE(poll_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (message_type IN ('direct', 'group', 'announcement')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    parent_message_id UUID REFERENCES messages(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    verification_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    verification_data JSONB,
    error_message TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_zip_code ON addresses(zip_code);
CREATE INDEX IF NOT EXISTS idx_politicians_user_id ON politicians(user_id);
CREATE INDEX IF NOT EXISTS idx_politicians_office_level ON politicians(office_level);
CREATE INDEX IF NOT EXISTS idx_polls_politician_id ON polls(politician_id);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_user_id ON poll_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can read own addresses" ON addresses
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = addresses.user_id));

CREATE POLICY "Users can insert own addresses" ON addresses
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = addresses.user_id));

CREATE POLICY "Users can update own addresses" ON addresses
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = addresses.user_id));

CREATE POLICY "Users can delete own addresses" ON addresses
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = addresses.user_id));

-- Politicians: Public read access for verified politicians, own data management
CREATE POLICY "Anyone can read verified politicians" ON politicians
    FOR SELECT USING (is_verified = true AND is_active = true);

CREATE POLICY "Politicians can manage own data" ON politicians
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = politicians.user_id));

-- Polls: Public can read active polls, politicians can manage their own
CREATE POLICY "Anyone can read active public polls" ON polls
    FOR SELECT USING (is_active = true AND visibility = 'public');

CREATE POLICY "Politicians can manage own polls" ON polls
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = (SELECT user_id FROM politicians WHERE politicians.id = polls.politician_id)));

-- Poll responses: Users can manage their own responses
CREATE POLICY "Users can read own poll responses" ON poll_responses
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = poll_responses.user_id));

CREATE POLICY "Users can insert poll responses" ON poll_responses
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = poll_responses.user_id));

-- Messages: Users can read/send their own messages
CREATE POLICY "Users can read own messages" ON messages
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = messages.sender_id) OR
        auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = messages.recipient_id)
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = messages.sender_id));

-- Verification logs: Users can read their own logs
CREATE POLICY "Users can read own verification logs" ON verification_logs
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE users.id = verification_logs.user_id));

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_user_id, email, first_name, last_name, date_of_birth, role)
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

-- Create trigger (this may need to be done in Supabase Dashboard)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM users WHERE auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for timestamp management
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_politicians_updated_at BEFORE UPDATE ON politicians
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Final comment to ensure proper termination
-- Schema setup complete!
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
