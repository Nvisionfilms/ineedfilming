-- Simple episodes table creation
CREATE TABLE episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    story_arc TEXT,
    filming_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    status TEXT DEFAULT 'planning',
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
