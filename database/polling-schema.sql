-- Citizenly Polling System Schema
-- Extension to legislative feed database for politician-citizen polling

-- Polls Table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    question TEXT NOT NULL,
    
    -- Context Reference (what they're "quote tweeting")
    context_type VARCHAR(20) NOT NULL CHECK (context_type IN ('bill', 'vote', 'appointment', 'general')),
    context_bill_id INTEGER REFERENCES bills(bill_id),
    context_roll_call_id INTEGER REFERENCES roll_calls(roll_call_id),
    context_legislator_id INTEGER REFERENCES legislators(people_id),
    context_custom_text TEXT,
    
    -- Poll Configuration
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    closes_at TIMESTAMP WITH TIME ZONE,
    
    -- Targeting (auto-populated based on politician's constituency)
    target_districts TEXT[] NOT NULL,
    target_level VARCHAR(10) NOT NULL CHECK (target_level IN ('federal', 'state', 'local')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Poll Responses Table
CREATE TABLE poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response Data
    response VARCHAR(20) NOT NULL CHECK (response IN ('approve', 'disapprove', 'no_opinion')),
    response_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- User Demographics (for analytics - captured at response time)
    user_age_group VARCHAR(10),
    user_district VARCHAR(20),
    user_zip_code VARCHAR(10),
    user_county VARCHAR(50),
    
    -- Privacy & Integrity
    response_hash VARCHAR(64) UNIQUE NOT NULL,
    
    -- Constraints
    UNIQUE(poll_id, user_id)
);

-- Sample Comments Table (MVP)
CREATE TABLE sample_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    commenter_role VARCHAR(20) NOT NULL CHECK (commenter_role IN ('constituent', 'expert', 'activist')),
    commenter_stance VARCHAR(20) CHECK (commenter_stance IN ('approve', 'disapprove', 'neutral')),
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_polls_politician ON polls(politician_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_districts ON polls USING GIN(target_districts);
CREATE INDEX idx_polls_context_bill ON polls(context_bill_id);
CREATE INDEX idx_polls_created ON polls(created_at);

CREATE INDEX idx_responses_poll ON poll_responses(poll_id);
CREATE INDEX idx_responses_timestamp ON poll_responses(response_timestamp);
CREATE INDEX idx_responses_demographics ON poll_responses(user_age_group, user_district);

CREATE INDEX idx_sample_comments_poll ON sample_comments(poll_id);
CREATE INDEX idx_sample_comments_order ON sample_comments(display_order);

-- Add updated_at trigger for polls
CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE polls IS 'Politician-created polls for constituent engagement';
COMMENT ON TABLE poll_responses IS 'Citizen responses to polls with demographics';
COMMENT ON TABLE sample_comments IS 'Curated sample comments for MVP demonstration';

COMMENT ON COLUMN polls.context_type IS 'Type of context: bill, vote, appointment, or general';
COMMENT ON COLUMN polls.target_districts IS 'Array of districts that can participate in this poll';
COMMENT ON COLUMN poll_responses.response_hash IS 'Hash of user_id + poll_id for unique constraint';
COMMENT ON COLUMN sample_comments.commenter_role IS 'Role of commenter for display purposes';