-- Fix projects RLS policies to ensure admins can update
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;

CREATE POLICY "Admins can view all projects"
  ON public.projects
  FOR SELECT
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update all projects"
  ON public.projects
  FOR UPDATE
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  USING (has_admin_role(auth.uid()));