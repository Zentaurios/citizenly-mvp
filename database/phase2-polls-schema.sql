-- ============================================================================
-- CITIZENLY PHASE 2: ENHANCED POLLING SYSTEM DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENHANCED POLLS TABLE (replaces existing basic polls table)
-- ============================================================================
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS polls CASCADE;

CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Poll configuration
    poll_type VARCHAR(50) NOT NULL DEFAULT 'yes_no', 
    -- Options: 'yes_no', 'multiple_choice', 'approval_rating', 'ranked_choice'
    options JSONB, -- For multiple choice: {"options": ["Option A", "Option B", "Option C"]}
    
    -- Targeting and audience
    target_audience JSONB DEFAULT '{}', -- Geographic/demographic filters
    congressional_district VARCHAR(10), -- Copy from politician for performance
    state_code VARCHAR(2), -- Copy from politician for performance
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'closed', 'archived'
    is_active BOOLEAN DEFAULT false,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits and settings
    max_responses INTEGER,
    requires_verification BOOLEAN DEFAULT true,
    allows_anonymous BOOLEAN DEFAULT false,
    show_results_before_vote BOOLEAN DEFAULT false,
    show_results_after_vote BOOLEAN DEFAULT true,
    
    -- Analytics and metadata
    total_responses INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2), -- Percentage of eligible voters who responded
    engagement_score DECIMAL(5,2), -- Calculated engagement metric
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_poll_type CHECK (poll_type IN ('yes_no', 'multiple_choice', 'approval_rating', 'ranked_choice')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    CONSTRAINT valid_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- ============================================================================
-- POLL RESPONSES TABLE
-- ============================================================================
CREATE TABLE poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response data
    response_data JSONB NOT NULL, 
    -- Examples:
    -- Yes/No: {"answer": "yes", "confidence": 8}
    -- Multiple choice: {"selected": ["option_a", "option_b"], "primary": "option_a"}
    -- Approval: {"rating": 7, "category": "approve"}
    
    -- Anonymized demographic data for analytics
    demographic_data JSONB DEFAULT '{}',
    -- Examples: {"age_group": "25-34", "district": "NV-01", "party_affiliation": "independent"}
    
    -- Security and fraud prevention
    ip_address INET,
    user_agent TEXT,
    response_hash VARCHAR(64), -- Hash for detecting duplicate responses
    verification_score INTEGER DEFAULT 100, -- 0-100, lower if suspicious activity
    
    -- Metadata
    response_time_seconds INTEGER, -- Time taken to respond (UX metric)
    device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(poll_id, user_id), -- One response per user per poll
    CONSTRAINT valid_verification_score CHECK (verification_score >= 0 AND verification_score <= 100)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    type VARCHAR(50) NOT NULL, 
    -- Options: 'new_poll', 'poll_results', 'poll_ending', 'poll_reminder', 'system_announcement'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    
    -- Additional data payload
    data JSONB DEFAULT '{}',
    -- Examples: {"poll_id": "uuid", "politician_name": "John Doe", "urgency": "high"}
    
    -- Delivery channels
    channels TEXT[] DEFAULT '{}', -- ['email', 'sms', 'push', 'in_app']
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    email_status VARCHAR(20), -- 'pending', 'sent', 'delivered', 'failed'
    sms_status VARCHAR(20),
    push_status VARCHAR(20),
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 5, -- 1-10, 10 being highest priority
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_notification_type CHECK (type IN ('new_poll', 'poll_results', 'poll_ending', 'poll_reminder', 'system_announcement')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

-- ============================================================================
-- POLL ANALYTICS TABLE (for aggregated data)
-- ============================================================================
CREATE TABLE poll_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    
    -- Snapshot metadata
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    snapshot_hour INTEGER, -- 0-23, for hourly snapshots
    
    -- Response metrics
    total_responses INTEGER DEFAULT 0,
    unique_responses INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2),
    
    -- Demographic breakdowns (anonymized)
    demographic_breakdown JSONB DEFAULT '{}',
    -- Example: {"age_groups": {"18-25": 45, "26-35": 67}, "districts": {"NV-01": 89, "NV-02": 23}}
    
    -- Response distribution
    response_distribution JSONB DEFAULT '{}',
    -- Example: {"yes": 156, "no": 89, "undecided": 12}
    
    -- Engagement metrics
    avg_response_time DECIMAL(8,2), -- Average time to respond in seconds
    completion_rate DECIMAL(5,2), -- Percentage who completed vs abandoned
    
    -- Geographic data
    geographic_distribution JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Notification type preferences
    new_poll_notifications BOOLEAN DEFAULT true,
    poll_result_notifications BOOLEAN DEFAULT true,
    poll_reminder_notifications BOOLEAN DEFAULT true,
    poll_ending_notifications BOOLEAN DEFAULT false,
    system_notifications BOOLEAN DEFAULT true,
    
    -- Frequency settings
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'hourly', 'daily', 'weekly'
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CONSTRAINT valid_digest_frequency CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Polls indexes
CREATE INDEX idx_polls_politician_id ON polls(politician_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_active ON polls(is_active);
CREATE INDEX idx_polls_congressional_district ON polls(congressional_district);
CREATE INDEX idx_polls_state_code ON polls(state_code);
CREATE INDEX idx_polls_created_at ON polls(created_at);
CREATE INDEX idx_polls_ends_at ON polls(ends_at);

-- Poll responses indexes
CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_user_id ON poll_responses(user_id);
CREATE INDEX idx_poll_responses_created_at ON poll_responses(created_at);
CREATE INDEX idx_poll_responses_ip_address ON poll_responses(ip_address);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- Analytics indexes
CREATE INDEX idx_poll_analytics_poll_id ON poll_analytics(poll_id);
CREATE INDEX idx_poll_analytics_snapshot_date ON poll_analytics(snapshot_date);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update poll response count
CREATE OR REPLACE FUNCTION update_poll_response_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE polls 
        SET total_responses = total_responses + 1,
            updated_at = NOW()
        WHERE id = NEW.poll_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE polls 
        SET total_responses = GREATEST(total_responses - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.poll_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update poll response counts
CREATE TRIGGER trigger_update_poll_response_count
    AFTER INSERT OR DELETE ON poll_responses
    FOR EACH ROW EXECUTE FUNCTION update_poll_response_count();

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_poll_responses_updated_at
    BEFORE UPDATE ON poll_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UPDATE EXISTING TABLES TO SUPPORT POLLS
-- ============================================================================

-- Add congressional_district and state_code to politicians table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politicians' AND column_name = 'congressional_district') THEN
        ALTER TABLE politicians ADD COLUMN congressional_district VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'politicians' AND column_name = 'state_code') THEN
        ALTER TABLE politicians ADD COLUMN state_code VARCHAR(2);
    END IF;
END $$;

-- Update politicians table with district and state data from addresses
UPDATE politicians 
SET congressional_district = a.congressional_district,
    state_code = a.state
FROM addresses a 
WHERE politicians.user_id = a.user_id 
AND a.is_primary = true
AND politicians.congressional_district IS NULL;

-- Add age group calculation function for demographic data
CREATE OR REPLACE FUNCTION calculate_age_group(birth_date DATE) 
RETURNS VARCHAR(10) AS $$
BEGIN
    CASE 
        WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 18 AND 24 THEN RETURN '18-24';
        WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 25 AND 34 THEN RETURN '25-34';
        WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 35 AND 44 THEN RETURN '35-44';
        WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 45 AND 54 THEN RETURN '45-54';
        WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 55 AND 64 THEN RETURN '55-64';
        WHEN DATE_PART('year', AGE(birth_date)) >= 65 THEN RETURN '65+';
        ELSE RETURN 'unknown';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users 
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences 
    WHERE notification_preferences.user_id = users.id
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY polls_politician_manage ON polls FOR ALL USING (
    politician_id IN (SELECT id FROM politicians WHERE user_id = current_setting('app.current_user_id')::uuid)
);
CREATE POLICY polls_public_read ON polls FOR SELECT USING (
    status = 'active' AND is_active = true
);

-- Poll responses policies
CREATE POLICY poll_responses_own_data ON poll_responses FOR ALL USING (
    user_id = current_setting('app.current_user_id')::uuid
);

-- Notifications policies
CREATE POLICY notifications_own_data ON notifications FOR ALL USING (
    user_id = current_setting('app.current_user_id')::uuid
);

-- Analytics policies (politicians can see their own poll analytics)
CREATE POLICY poll_analytics_politician_read ON poll_analytics FOR SELECT USING (
    poll_id IN (
        SELECT p.id FROM polls p 
        JOIN politicians pol ON p.politician_id = pol.id 
        WHERE pol.user_id = current_setting('app.current_user_id')::uuid
    )
);

-- Notification preferences policies
CREATE POLICY notification_preferences_own_data ON notification_preferences FOR ALL USING (
    user_id = current_setting('app.current_user_id')::uuid
);

-- Grant permissions
GRANT ALL ON polls TO authenticated;
GRANT ALL ON poll_responses TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON poll_analytics TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- Comments for documentation
COMMENT ON TABLE polls IS 'Enhanced polling system with multiple poll types and advanced targeting';
COMMENT ON TABLE poll_responses IS 'Citizen responses to polls with anonymized demographic data';
COMMENT ON TABLE notifications IS 'Multi-channel notification system for real-time engagement';
COMMENT ON TABLE poll_analytics IS 'Aggregated analytics data for poll performance tracking';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery and timing';
