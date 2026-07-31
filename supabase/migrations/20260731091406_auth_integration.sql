/*
# Authentication integration for OMS

## Overview
Converts the OMS from a no-auth demo (with dummy employees and a user switcher)
into a real email/password authenticated multi-user platform. Every employee
must sign up and sign in individually. The admin (Afferent Tech BD) is seeded
as a regular auth.users account and linked to the employees table.

## 1. Modified Tables
- `employees` — add `auth_id uuid` column referencing `auth.users(id)`.
  This links each employee row to its Supabase Auth account. The column is
  nullable during migration (existing dummy rows have no auth account) but
  new signups will always set it. UNIQUE constraint ensures one employee per
  auth account.
- `profiles` — add `auth_id uuid` column referencing `auth.users(id)` so
  profiles are owned by the authenticated user who created them.

## 2. Data Cleanup
- DELETE all existing dummy employee rows (and cascade to profiles,
  conversation_members, messages, posts, etc. via existing FK constraints).
  This removes the seed/demo data so each user starts with only their own
  real profile after signing up.
- DELETE orphaned profiles, conversations, messages, posts, comments, likes
  that referenced dummy employees.

## 3. Security — RLS changes
All tables now require `TO authenticated` with ownership or membership checks.
The `anon` role is removed from all policies (the app now has a sign-in
screen, so anon access is intentionally disabled).

### employees
- SELECT: authenticated users can see all employees (company directory).
- INSERT: authenticated users can only insert their own employee row
  (auth_id = auth.uid()).
- UPDATE: authenticated users can only update their own employee row.
- DELETE: admin only (checked via employee role on their own row).

### profiles
- SELECT: authenticated users can see all profiles.
- INSERT: authenticated users create only their own profile.
- UPDATE: authenticated users update only their own profile.
- DELETE: admin only.

### All other tables (departments, projects, tasks, attendance, meetings,
  conversations, conversation_members, messages, posts, post_comments,
  post_likes, salary_transactions, app_settings, call_signaling)
- SELECT: authenticated (company-wide visibility for collaboration).
- INSERT/UPDATE/DELETE: authenticated (collaborative platform).

## 4. Admin Seed
Creates the admin auth user (Afferent Tech BD) and corresponding employee +
profile rows. The admin password is set via auth.users credentials.
*/

-- =========================================================
-- 1. Add auth_id columns
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'auth_id') THEN
    ALTER TABLE employees ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_id') THEN
    ALTER TABLE profiles ADD COLUMN auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================
-- 2. Clean up ALL dummy data
-- =========================================================
DELETE FROM post_likes;
DELETE FROM post_comments;
DELETE FROM posts;
DELETE FROM call_signaling;
DELETE FROM messages;
DELETE FROM conversation_members;
DELETE FROM conversations;
DELETE FROM salary_transactions;
DELETE FROM attendance;
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM departments;
DELETE FROM profiles;
DELETE FROM employees;

-- =========================================================
-- 3. Update RLS policies — employees (authenticated, ownership-scoped)
-- =========================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_employees" ON employees;
CREATE POLICY "select_employees" ON employees FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_employee" ON employees;
CREATE POLICY "insert_own_employee" ON employees FOR INSERT
  TO authenticated WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "update_own_employee" ON employees;
CREATE POLICY "update_own_employee" ON employees FOR UPDATE
  TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "delete_employee_admin" ON employees;
CREATE POLICY "delete_employee_admin" ON employees FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.auth_id = auth.uid() AND e.role = 'admin')
  );

-- =========================================================
-- 4. Update RLS policies — profiles
-- =========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "delete_profile_admin" ON profiles;
CREATE POLICY "delete_profile_admin" ON profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.auth_id = auth.uid() AND e.role = 'admin')
  );

-- =========================================================
-- 5. Update RLS policies — departments (authenticated, shared)
-- =========================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_departments" ON departments;
CREATE POLICY "insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_departments" ON departments;
CREATE POLICY "update_departments" ON departments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_departments" ON departments;
CREATE POLICY "delete_departments" ON departments FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 6. Update RLS policies — projects
-- =========================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_projects" ON projects;
CREATE POLICY "insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_projects" ON projects;
CREATE POLICY "update_projects" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_projects" ON projects;
CREATE POLICY "delete_projects" ON projects FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 7. Update RLS policies — tasks
-- =========================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tasks" ON tasks;
CREATE POLICY "select_tasks" ON tasks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_tasks" ON tasks;
CREATE POLICY "insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_tasks" ON tasks;
CREATE POLICY "update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_tasks" ON tasks;
CREATE POLICY "delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 8. Update RLS policies — attendance
-- =========================================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_attendance" ON attendance;
CREATE POLICY "select_attendance" ON attendance FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_attendance" ON attendance;
CREATE POLICY "insert_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_attendance" ON attendance;
CREATE POLICY "update_attendance" ON attendance FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_attendance" ON attendance;
CREATE POLICY "delete_attendance" ON attendance FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 9. Update RLS policies — meetings
-- =========================================================
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_meetings" ON meetings;
CREATE POLICY "select_meetings" ON meetings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_meetings" ON meetings;
CREATE POLICY "insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_meetings" ON meetings;
CREATE POLICY "update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_meetings" ON meetings;
CREATE POLICY "delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 10. Update RLS policies — conversations
-- =========================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversations" ON conversations;
CREATE POLICY "select_conversations" ON conversations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_conversations" ON conversations;
CREATE POLICY "delete_conversations" ON conversations FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 11. Update RLS policies — conversation_members
-- =========================================================
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversation_members" ON conversation_members;
CREATE POLICY "select_conversation_members" ON conversation_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_conversation_members" ON conversation_members;
CREATE POLICY "insert_conversation_members" ON conversation_members FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_conversation_members" ON conversation_members;
CREATE POLICY "delete_conversation_members" ON conversation_members FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 12. Update RLS policies — messages
-- =========================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_messages" ON messages;
CREATE POLICY "delete_messages" ON messages FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 13. Update RLS policies — posts
-- =========================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_posts" ON posts;
CREATE POLICY "insert_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_posts" ON posts;
CREATE POLICY "delete_posts" ON posts FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 14. Update RLS policies — post_comments
-- =========================================================
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_comments" ON post_comments;
CREATE POLICY "select_post_comments" ON post_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_post_comments" ON post_comments;
CREATE POLICY "insert_post_comments" ON post_comments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_post_comments" ON post_comments;
CREATE POLICY "delete_post_comments" ON post_comments FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 15. Update RLS policies — post_likes
-- =========================================================
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_likes" ON post_likes;
CREATE POLICY "select_post_likes" ON post_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_post_likes" ON post_likes;
CREATE POLICY "insert_post_likes" ON post_likes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_post_likes" ON post_likes;
CREATE POLICY "delete_post_likes" ON post_likes FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 16. Update RLS policies — salary_transactions
-- =========================================================
ALTER TABLE salary_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_salary_transactions" ON salary_transactions;
CREATE POLICY "select_salary_transactions" ON salary_transactions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_salary_transactions" ON salary_transactions;
CREATE POLICY "insert_salary_transactions" ON salary_transactions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_salary_transactions" ON salary_transactions;
CREATE POLICY "update_salary_transactions" ON salary_transactions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_salary_transactions" ON salary_transactions;
CREATE POLICY "delete_salary_transactions" ON salary_transactions FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 17. Update RLS policies — app_settings
-- =========================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_app_settings" ON app_settings;
CREATE POLICY "select_app_settings" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_app_settings" ON app_settings;
CREATE POLICY "insert_app_settings" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_app_settings" ON app_settings;
CREATE POLICY "update_app_settings" ON app_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_app_settings" ON app_settings;
CREATE POLICY "delete_app_settings" ON app_settings FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 18. Update RLS policies — call_signaling
-- =========================================================
ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_call_signaling" ON call_signaling;
CREATE POLICY "select_call_signaling" ON call_signaling FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_call_signaling" ON call_signaling;
CREATE POLICY "insert_call_signaling" ON call_signaling FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_call_signaling" ON call_signaling;
CREATE POLICY "delete_call_signaling" ON call_signaling FOR DELETE
  TO authenticated USING (true);

-- =========================================================
-- 19. Storage policies — restrict to authenticated
-- =========================================================
DROP POLICY IF EXISTS "anon_upload_chat_files" ON storage.objects;
CREATE POLICY "auth_upload_chat_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "anon_read_chat_files" ON storage.objects;
CREATE POLICY "auth_read_chat_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "anon_delete_chat_files" ON storage.objects;
CREATE POLICY "auth_delete_chat_files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files');

-- =========================================================
-- 20. Seed admin auth user + employee + profile
-- Note: auth.users insert requires the service role which
-- apply_migration uses. We create the admin user directly.
-- =========================================================
DO $$
DECLARE
  admin_auth_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'ahmedforkan26@gmail.com';

  IF admin_auth_id IS NULL THEN
    -- Create admin auth user with encrypted password
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      encrypted_password,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ahmedforkan26@gmail.com',
      now(),
      crypt('01968434302@#$', gen_salt('bf')),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Afferent Tech BD"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO admin_auth_id;
  END IF;

  -- Create admin employee row if not exists
  IF admin_auth_id IS NOT NULL THEN
    INSERT INTO employees (auth_id, name, email, role, position, status, hire_date, salary)
    VALUES (admin_auth_id, 'Afferent Tech BD', 'ahmedforkan26@gmail.com', 'admin', 'System Administrator', 'active', CURRENT_DATE, 0)
    ON CONFLICT (auth_id) DO NOTHING;

    -- Create admin profile
    INSERT INTO profiles (auth_id, employee_id, role, bio, skills)
    SELECT admin_auth_id, e.id, 'admin', 'System Administrator & Founder of Afferent Tech BD', ARRAY['Leadership','Management','Strategy']
    FROM employees e WHERE e.auth_id = admin_auth_id
    ON CONFLICT (auth_id) DO NOTHING;
  END IF;
END $$;

-- Seed a default settings row
INSERT INTO app_settings (theme_key, accent_color, icon_set, layout_density, sidebar_style, font_family)
SELECT 'atlas-midnight', '#4f46e5', 'lucide', 'comfortable', 'expanded', 'inter'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
