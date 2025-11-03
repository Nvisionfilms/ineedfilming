-- Create deliverables table for tracking main deliverable records
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  specs JSONB, -- Store specs like format (Reel, YT, 16:9, 9:16), duration, resolution
  deliverable_type TEXT NOT NULL, -- 'video', 'image', 'document', etc.
  max_revisions INTEGER DEFAULT 2, -- Trigger change order after this many revisions
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deliverable_versions table for version control
CREATE TABLE public.deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  storage_bucket TEXT NOT NULL, -- 'project-deliverables'
  status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'approved', 'changes_requested', 'needs_change_order'
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(deliverable_id, version_number)
);

-- Create deliverable_feedback table for revision requests and comments
CREATE TABLE public.deliverable_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.deliverable_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL, -- 'approval', 'revision_request', 'comment'
  message TEXT NOT NULL,
  timecode TEXT, -- For video feedback: "00:02:30"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deliverables
CREATE POLICY "Admins can manage all deliverables"
  ON public.deliverables FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view deliverables for their project"
  ON public.deliverables FOR SELECT
  USING (
    is_client(auth.uid()) AND 
    project_id = get_client_project_id(auth.uid())
  );

-- RLS Policies for deliverable_versions
CREATE POLICY "Admins can manage all versions"
  ON public.deliverable_versions FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can upload versions"
  ON public.deliverable_versions FOR INSERT
  WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view versions for their project"
  ON public.deliverable_versions FOR SELECT
  USING (
    is_client(auth.uid()) AND 
    deliverable_id IN (
      SELECT id FROM public.deliverables 
      WHERE project_id = get_client_project_id(auth.uid())
    )
  );

CREATE POLICY "Clients can approve versions"
  ON public.deliverable_versions FOR UPDATE
  USING (
    is_client(auth.uid()) AND 
    deliverable_id IN (
      SELECT id FROM public.deliverables 
      WHERE project_id = get_client_project_id(auth.uid())
    )
  )
  WITH CHECK (
    is_client(auth.uid()) AND 
    deliverable_id IN (
      SELECT id FROM public.deliverables 
      WHERE project_id = get_client_project_id(auth.uid())
    )
  );

-- RLS Policies for deliverable_feedback
CREATE POLICY "Admins can manage all feedback"
  ON public.deliverable_feedback FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can add feedback to their project versions"
  ON public.deliverable_feedback FOR INSERT
  WITH CHECK (
    is_client(auth.uid()) AND 
    version_id IN (
      SELECT dv.id FROM public.deliverable_versions dv
      JOIN public.deliverables d ON d.id = dv.deliverable_id
      WHERE d.project_id = get_client_project_id(auth.uid())
    )
  );

CREATE POLICY "Clients can view feedback on their project versions"
  ON public.deliverable_feedback FOR SELECT
  USING (
    is_client(auth.uid()) AND 
    version_id IN (
      SELECT dv.id FROM public.deliverable_versions dv
      JOIN public.deliverables d ON d.id = dv.deliverable_id
      WHERE d.project_id = get_client_project_id(auth.uid())
    )
  );

-- Create indexes for performance
CREATE INDEX idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX idx_deliverable_versions_deliverable_id ON public.deliverable_versions(deliverable_id);
CREATE INDEX idx_deliverable_versions_status ON public.deliverable_versions(status);
CREATE INDEX idx_deliverable_feedback_version_id ON public.deliverable_feedback(version_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_deliverable_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for deliverables updated_at
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deliverable_updated_at();