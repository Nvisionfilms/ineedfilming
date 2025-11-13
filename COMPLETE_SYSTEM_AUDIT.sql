-- COMPLETE SYSTEM AUDIT
-- Run this to verify all tables and relationships are correct

-- 1. Check all required tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles',
  'user_roles',
  'client_accounts',
  'projects',
  'episodes',
  'client_messages',
  'project_files',
  'deliverable_versions',
  'custom_booking_requests'
)
ORDER BY table_name;

-- 2. Check client_accounts structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'client_accounts'
ORDER BY ordinal_position;

-- 3. Check projects structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- 4. Check client_messages structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'client_messages'
ORDER BY ordinal_position;

-- 5. Check storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;

-- 6. Check RLS policies for client_accounts
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'client_accounts'
ORDER BY policyname;

-- 7. Check RLS policies for projects
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'projects'
ORDER BY policyname;

-- 8. Check RLS policies for client_messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'client_messages'
ORDER BY policyname;

-- 9. Check storage RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 10. Count existing data
SELECT 
  'client_accounts' as table_name, COUNT(*) as record_count FROM client_accounts
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'episodes', COUNT(*) FROM episodes
UNION ALL
SELECT 'client_messages', COUNT(*) FROM client_messages
UNION ALL
SELECT 'project_files', COUNT(*) FROM project_files
UNION ALL
SELECT 'custom_booking_requests', COUNT(*) FROM custom_booking_requests;
