-- Create missing notifications table for MVP
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    type VARCHAR(50) NOT NULL, 
    title VARCHAR(255) NOT NULL,
    content TEXT,
    
    -- Additional data payload
    data JSONB DEFAULT '{}',
    
    -- Delivery channels
    channels TEXT[] DEFAULT '{}',
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    email_status VARCHAR(20),
    sms_status VARCHAR(20),
    push_status VARCHAR(20),
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 5,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_notification_type CHECK (type IN ('new_poll', 'poll_results', 'poll_ending', 'poll_reminder', 'system_announcement')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

-- Also create user_legislative_interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_legislative_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subjects TEXT[] DEFAULT '{}',
    follow_districts TEXT[] DEFAULT '{}',
    notification_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);