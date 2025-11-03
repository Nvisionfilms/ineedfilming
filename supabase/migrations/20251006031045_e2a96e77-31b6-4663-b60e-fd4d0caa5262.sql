-- Allow authenticated users to view admin user IDs for messaging purposes
CREATE POLICY "Users can view admin user IDs" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (role = 'admin');