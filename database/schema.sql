-- Citizenly Database Schema
-- Version: 1.0 (MVP)
-- Description: Core schema for civic engagement platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    congressional_district VARCHAR(10),
    state_senate_district VARCHAR(10),
    state_house_district VARCHAR(10),
    county VARCHAR(100),
    timezone VARCHAR(50),
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Politicians table
CREATE TABLE politicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    office_level VARCHAR(20) NOT NULL CHECK (office_level IN ('federal', 'state', 'county', 'city')),
    office_title VARCHAR(100) NOT NULL,
    district VARCHAR(50),
    state VARCHAR(2) NOT NULL,
    party VARCHAR(50),
    term_start DATE,
    term_end DATE,
    website VARCHAR(500),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    premium_access BOOLEAN NOT NULL DEFAULT false,
    verification_documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification attempts table
CREATE TABLE verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('id', 'address', 'politician')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    documents TEXT[],
    metadata JSONB,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Polls table (for future implementation)
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poll_type VARCHAR(20) NOT NULL CHECK (poll_type IN ('yes_no', 'approval', 'multiple_choice')),
    options JSONB,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    target_constituency VARCHAR(20) NOT NULL DEFAULT 'district' CHECK (target_constituency IN ('all', 'district', 'state', 'custom')),
    constituency_filter JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Poll responses table (for future implementation)
CREATE TABLE poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_congressional_district ON addresses(congressional_district);
CREATE INDEX idx_addresses_state ON addresses(state);
CREATE INDEX idx_addresses_is_primary ON addresses(is_primary);

CREATE INDEX idx_politicians_user_id ON politicians(user_id);
CREATE INDEX idx_politicians_office_level ON politicians(office_level);
CREATE INDEX idx_politicians_state ON politicians(state);
CREATE INDEX idx_politicians_is_verified ON politicians(is_verified);

CREATE INDEX idx_verification_attempts_user_id ON verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_status ON verification_attempts(status);
CREATE INDEX idx_verification_attempts_type ON verification_attempts(verification_type);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_polls_politician_id ON polls(politician_id);
CREATE INDEX idx_polls_is_active ON polls(is_active);
CREATE INDEX idx_polls_end_date ON polls(end_date);

CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_user_id ON poll_responses(user_id);

-- Create trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_politicians_updated_at BEFORE UPDATE ON politicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_attempts_updated_at BEFORE UPDATE ON verification_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW verified_citizens AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    a.congressional_district,
    a.state_senate_district,
    a.state_house_district,
    a.county,
    a.state
FROM users u
JOIN addresses a ON u.id = a.user_id
WHERE u.role = 'citizen' 
    AND u.verification_status = 'verified' 
    AND u.is_active = true
    AND a.is_primary = true;

CREATE VIEW verified_politicians AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    p.office_level,
    p.office_title,
    p.district,
    p.state,
    p.party,
    p.is_verified,
    p.premium_access
FROM users u
JOIN politicians p ON u.id = p.user_id
WHERE u.role = 'politician' 
    AND u.verification_status = 'verified' 
    AND u.is_active = true;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY users_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::uuid);

-- Addresses policy
CREATE POLICY addresses_own_data ON addresses FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Politicians can view their own data, others can view verified politicians
CREATE POLICY politicians_own_data ON politicians FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY politicians_public_read ON politicians FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = politicians.user_id AND verification_status = 'verified')
);

-- Verification attempts - own data only
CREATE POLICY verification_attempts_own_data ON verification_attempts FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Sessions - own data only
CREATE POLICY sessions_own_data ON sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Polls - politicians can manage their own, verified users can view active polls
CREATE POLICY polls_politician_manage ON polls FOR ALL USING (
    politician_id IN (SELECT id FROM politicians WHERE user_id = current_setting('app.current_user_id')::uuid)
);
CREATE POLICY polls_public_read ON polls FOR SELECT USING (is_active = true);

-- Poll responses - users can manage their own responses
CREATE POLICY poll_responses_own_data ON poll_responses FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert initial data
INSERT INTO users (email, first_name, last_name, date_of_birth, password_hash, role, verification_status, email_verified, is_active) VALUES
('admin@citizenly.com', 'Admin', 'User', '1980-01-01', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewKYlGvgJKWKR3Qm', 'admin', 'verified', true, true),
('citizen@test.com', 'Test', 'Citizen', '1990-05-15', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewKYlGvgJKWKR3Qm', 'citizen', 'verified', true, true);

-- Insert test address for citizen
INSERT INTO addresses (user_id, street_address, city, state, zip_code, congressional_district, county, is_primary)
SELECT id, '123 Test Street', 'Las Vegas', 'NV', '89123', '3', 'Clark', true
FROM users WHERE email = 'citizen@test.com';

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user accounts for citizens, politicians, and admins';
COMMENT ON TABLE addresses IS 'User addresses for geographic verification and district mapping';
COMMENT ON TABLE politicians IS 'Extended data for verified political officials';
COMMENT ON TABLE verification_attempts IS 'Track ID and office verification attempts';
COMMENT ON TABLE sessions IS 'User session management for authentication';
COMMENT ON TABLE audit_logs IS 'Security and action audit trail';
COMMENT ON TABLE polls IS 'Politician-created polls for constituent feedback';
COMMENT ON TABLE poll_responses IS 'Citizen responses to polls';

COMMENT ON COLUMN users.verification_status IS 'pending, verified, or rejected - controls access to features';
COMMENT ON COLUMN addresses.congressional_district IS 'Used for matching citizens to representatives';
COMMENT ON COLUMN politicians.premium_access IS 'Enables $10k premium features like nationwide poll data';
COMMENT ON COLUMN polls.target_constituency IS 'Defines who can participate in the poll';
