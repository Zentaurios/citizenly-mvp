-- Legislative Feed Database Schema
-- Addition to existing Citizenly database for Nevada legislative tracking
-- Uses LegiScan API for bill and vote data

-- Legislative Sessions Table
CREATE TABLE legislative_sessions (
    session_id INTEGER PRIMARY KEY, -- LegiScan session_id
    state_id INTEGER NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'NV',
    year_start INTEGER NOT NULL,
    year_end INTEGER NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    special BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    dataset_hash VARCHAR(32), -- For change detection
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bills Table
CREATE TABLE bills (
    bill_id INTEGER PRIMARY KEY, -- LegiScan bill_id
    session_id INTEGER REFERENCES legislative_sessions(session_id),
    bill_number VARCHAR(50) NOT NULL,
    bill_type VARCHAR(10) NOT NULL, -- "B", "R", "CR", etc.
    title TEXT NOT NULL,
    description TEXT,
    status INTEGER NOT NULL, -- 0-6 (Intro, Engrossed, Enrolled, Passed, Vetoed, Failed)
    status_date DATE,
    last_action TEXT,
    last_action_date DATE,
    chamber VARCHAR(1), -- "S" or "H"
    current_committee_id INTEGER,
    subjects TEXT[], -- ["Education", "Healthcare"]
    change_hash VARCHAR(32) NOT NULL, -- For efficient updates
    legiscan_url VARCHAR(500),
    state_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Legislators Table
CREATE TABLE legislators (
    people_id INTEGER PRIMARY KEY, -- LegiScan people_id
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    party VARCHAR(1) NOT NULL, -- "D", "R", "I"
    role VARCHAR(10) NOT NULL, -- "Rep", "Sen"
    district VARCHAR(20) NOT NULL, -- "HD-025", "SD-04", "NV-02"
    chamber VARCHAR(1), -- "H", "S"
    state VARCHAR(2) NOT NULL DEFAULT 'NV',
    level VARCHAR(10) NOT NULL, -- "state", "federal"
    votesmart_id INTEGER,
    ballotpedia VARCHAR(255),
    person_hash VARCHAR(32), -- For change detection
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roll Calls Table
CREATE TABLE roll_calls (
    roll_call_id INTEGER PRIMARY KEY, -- LegiScan roll_call_id
    bill_id INTEGER REFERENCES bills(bill_id),
    date DATE,
    description TEXT NOT NULL,
    chamber VARCHAR(1) NOT NULL,
    yea_count INTEGER DEFAULT 0,
    nay_count INTEGER DEFAULT 0,
    not_voting_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    passed BOOLEAN NOT NULL,
    legiscan_url VARCHAR(500),
    state_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Individual Votes Table
CREATE TABLE individual_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_call_id INTEGER REFERENCES roll_calls(roll_call_id),
    people_id INTEGER REFERENCES legislators(people_id),
    vote_type INTEGER NOT NULL, -- 1=Yea, 2=Nay, 3=Not Voting, 4=Absent
    vote_text VARCHAR(20) NOT NULL, -- "Yea", "Nay", "NV", "Absent"
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(roll_call_id, people_id)
);

-- Bill Sponsors Table
CREATE TABLE bill_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id INTEGER REFERENCES bills(bill_id),
    people_id INTEGER REFERENCES legislators(people_id),
    sponsor_type INTEGER NOT NULL, -- 1=Primary, 2=Co-sponsor, 3=Joint
    sponsor_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(bill_id, people_id)
);

-- Feed Items Table (Materialized Feed)
CREATE TABLE feed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL, -- "bill_introduced", "vote_scheduled", "vote_result", "status_change"
    title VARCHAR(500) NOT NULL,
    description TEXT,
    bill_id INTEGER REFERENCES bills(bill_id),
    roll_call_id INTEGER REFERENCES roll_calls(roll_call_id),
    people_id INTEGER REFERENCES legislators(people_id),
    action_date DATE NOT NULL,
    subjects TEXT[], -- For filtering by user interests
    districts TEXT[], -- ["NV-02", "SD-04", "HD-25"] for targeting users
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Legislative Interests Table (connects to existing users table)
CREATE TABLE user_legislative_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subjects TEXT[] NOT NULL DEFAULT '{}', -- Legislative subjects of interest
    follow_districts TEXT[] NOT NULL DEFAULT '{}', -- Districts to follow beyond user's own
    notification_types TEXT[] NOT NULL DEFAULT '{"bill_introduced", "vote_result"}', -- Types of updates to receive
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_bills_session ON bills(session_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_subjects ON bills USING GIN(subjects);
CREATE INDEX idx_bills_change_hash ON bills(change_hash);
CREATE INDEX idx_bills_last_action_date ON bills(last_action_date);

CREATE INDEX idx_legislators_district ON legislators(district);
CREATE INDEX idx_legislators_party ON legislators(party);
CREATE INDEX idx_legislators_active ON legislators(active);
CREATE INDEX idx_legislators_level ON legislators(level);

CREATE INDEX idx_roll_calls_bill ON roll_calls(bill_id);
CREATE INDEX idx_roll_calls_date ON roll_calls(date);
CREATE INDEX idx_roll_calls_passed ON roll_calls(passed);

CREATE INDEX idx_individual_votes_roll_call ON individual_votes(roll_call_id);
CREATE INDEX idx_individual_votes_legislator ON individual_votes(people_id);

CREATE INDEX idx_sponsors_bill ON bill_sponsors(bill_id);
CREATE INDEX idx_sponsors_legislator ON bill_sponsors(people_id);

CREATE INDEX idx_feed_items_type ON feed_items(type);
CREATE INDEX idx_feed_items_date ON feed_items(action_date);
CREATE INDEX idx_feed_items_subjects ON feed_items USING GIN(subjects);
CREATE INDEX idx_feed_items_districts ON feed_items USING GIN(districts);

CREATE INDEX idx_user_legislative_interests_user_id ON user_legislative_interests(user_id);
CREATE INDEX idx_user_legislative_interests_subjects ON user_legislative_interests USING GIN(subjects);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_legislative_sessions_updated_at BEFORE UPDATE ON legislative_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legislators_updated_at BEFORE UPDATE ON legislators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_legislative_interests_updated_at BEFORE UPDATE ON user_legislative_interests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW active_bills AS
SELECT 
    b.*,
    ls.session_name,
    ls.year_start,
    ls.year_end
FROM bills b
JOIN legislative_sessions ls ON b.session_id = ls.session_id
WHERE ls.active = true
ORDER BY b.last_action_date DESC;

CREATE VIEW user_feed_items AS
SELECT 
    fi.*,
    b.bill_number,
    b.title as bill_title,
    rc.description as vote_description,
    l.full_name as legislator_name
FROM feed_items fi
LEFT JOIN bills b ON fi.bill_id = b.bill_id  
LEFT JOIN roll_calls rc ON fi.roll_call_id = rc.roll_call_id
LEFT JOIN legislators l ON fi.people_id = l.people_id
ORDER BY fi.action_date DESC, fi.created_at DESC;

-- Row Level Security for legislative tables
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legislative_interests ENABLE ROW LEVEL SECURITY;

-- Feed items are publicly readable
CREATE POLICY feed_items_public_read ON feed_items FOR SELECT USING (true);

-- Users can only manage their own legislative interests
CREATE POLICY user_legislative_interests_own_data ON user_legislative_interests 
FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Grant permissions on new tables
GRANT SELECT ON legislative_sessions TO authenticated;
GRANT SELECT ON bills TO authenticated;
GRANT SELECT ON legislators TO authenticated;
GRANT SELECT ON roll_calls TO authenticated;
GRANT SELECT ON individual_votes TO authenticated;
GRANT SELECT ON bill_sponsors TO authenticated;
GRANT SELECT ON feed_items TO authenticated;
GRANT ALL ON user_legislative_interests TO authenticated;

-- Comments for documentation
COMMENT ON TABLE legislative_sessions IS 'Nevada legislative sessions from LegiScan API';
COMMENT ON TABLE bills IS 'Bills tracked from Nevada legislature via LegiScan';
COMMENT ON TABLE legislators IS 'Nevada legislators (state and federal) from LegiScan';
COMMENT ON TABLE roll_calls IS 'Voting records on bills from LegiScan';
COMMENT ON TABLE individual_votes IS 'Individual legislator votes on roll calls';
COMMENT ON TABLE bill_sponsors IS 'Bill sponsorship relationships';
COMMENT ON TABLE feed_items IS 'Materialized feed of legislative updates for users';
COMMENT ON TABLE user_legislative_interests IS 'User preferences for legislative feed filtering';

COMMENT ON COLUMN bills.change_hash IS 'LegiScan change hash for efficient update detection';
COMMENT ON COLUMN feed_items.districts IS 'Array of districts affected by this update';
COMMENT ON COLUMN feed_items.subjects IS 'Legislative subjects for filtering';
COMMENT ON COLUMN user_legislative_interests.follow_districts IS 'Additional districts beyond users own to follow';