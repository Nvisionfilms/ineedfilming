-- ============================================
-- PRODUCTION TOOLS SCHEMA
-- ============================================
-- Creates tables for shot lists, call sheets, and locations

-- ============================================
-- 1. LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view locations" 
  ON public.locations FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team members can manage their locations" 
  ON public.locations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- 2. SHOT LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.shot_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shot_lists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view shot lists" 
  ON public.shot_lists FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team members can manage their shot lists" 
  ON public.shot_lists FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- 3. SHOT LIST ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.shot_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_list_id UUID NOT NULL REFERENCES public.shot_lists(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  duration_seconds INT DEFAULT 5,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shot_list_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CALL SHEETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.call_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shoot_date DATE NOT NULL,
  call_time TIME NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  weather_notes TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.call_sheets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CALL SHEET CREW
-- ============================================
CREATE TABLE IF NOT EXISTS public.call_sheet_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID NOT NULL REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  call_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.call_sheet_crew ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CALL SHEET SHOTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.call_sheet_shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID NOT NULL REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  shot_list_item_id UUID REFERENCES public.shot_list_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  talent TEXT,
  props TEXT,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.call_sheet_shots ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE DEFAULT ROLES FOR PRODUCTION
-- ============================================
INSERT INTO public.user_roles (role, description)
VALUES 
  ('director', 'Project Director'),
  ('dp', 'Director of Photography'),
  ('producer', 'Producer'),
  ('pa', 'Production Assistant'),
  ('editor', 'Video Editor')
ON CONFLICT (role) DO NOTHING;

-- ============================================
-- 8. ADD PRODUCTION TOOLS TO NAVIGATION
-- ============================================
-- This will be handled in the UI components

-- ============================================
-- 9. CREATE DEFAULT SHOT LIST TEMPLATES
-- ============================================
-- These can be inserted via the UI later

-- ============================================
-- 10. CREATE DEFAULT CALL SHEET TEMPLATES
-- ============================================
-- These can be inserted via the UI later
