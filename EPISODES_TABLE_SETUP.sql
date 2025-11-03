-- Create episodes table for Episode Planner feature
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    story_arc TEXT,
    filming_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'filming', 'editing', 'delivered')),
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON public.episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON public.episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_episode_number ON public.episodes(episode_number);

-- Enable Row Level Security
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all episodes"
    ON public.episodes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert episodes"
    ON public.episodes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update episodes"
    ON public.episodes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete episodes"
    ON public.episodes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Create policy for clients to view their project's episodes
CREATE POLICY "Clients can view their project episodes"
    ON public.episodes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.client_accounts
            WHERE client_accounts.user_id = auth.uid()
            AND client_accounts.project_id = episodes.project_id
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON public.episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.episodes IS 'Stores episode information for multi-episode founder series';
