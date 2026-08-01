/*
# Account-based authentication system

## Overview
Replaces open email signup with admin-controlled account creation.
Users cannot self-register. The admin creates accounts with a username
(display ID) + password from the admin panel. Users sign in with that
username + password, then set up their own profile. The admin approves
each account before the user gets full access.

## 1. New Tables
- `admin_user_credentials` — stores admin-set usernames and links them to
  auth.users + employees.

## 2. Modified Tables
- `employees` — add `account_status` (pending/approved/rejected) and
  `username` columns.

## 3. Security
- SECURITY DEFINER functions for admin_create_user, admin_approve_user,
  admin_reject_user, admin_update_user_password, user_complete_profile.
*/

-- =========================================================
-- 1. Add columns to employees
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'account_status') THEN
    ALTER TABLE employees ADD COLUMN account_status text NOT NULL DEFAULT 'approved';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'username') THEN
    ALTER TABLE employees ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- =========================================================
-- 2. Create admin_user_credentials table
-- =========================================================
CREATE TABLE IF NOT EXISTS admin_user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  auth_email text NOT NULL,
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_credentials" ON admin_user_credentials;
CREATE POLICY "select_credentials" ON admin_user_credentials FOR SELECT
  TO authenticated USING (true);

-- =========================================================
-- 3. SECURITY DEFINER functions
-- =========================================================
CREATE OR REPLACE FUNCTION is_admin(check_auth_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE auth_id = check_auth_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION admin_create_user(
  p_username text,
  p_password text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id uuid;
  v_email text;
  v_emp_id uuid;
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    v_result := jsonb_build_object('error', 'Only admin can create accounts');
    RETURN v_result;
  END IF;

  IF length(p_username) < 3 THEN
    v_result := jsonb_build_object('error', 'Username must be at least 3 characters');
    RETURN v_result;
  END IF;
  IF length(p_password) < 6 THEN
    v_result := jsonb_build_object('error', 'Password must be at least 6 characters');
    RETURN v_result;
  END IF;

  IF EXISTS (SELECT 1 FROM admin_user_credentials WHERE username = p_username) THEN
    v_result := jsonb_build_object('error', 'Username already taken');
    RETURN v_result;
  END IF;

  v_email := lower(p_username) || '@afftech.bd';

  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;
  IF v_auth_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      email_confirmed_at, encrypted_password,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change,
      email_change_token_new, email_change_token_current
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', v_email,
      now(), crypt(p_password, gen_salt('bf')),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', p_display_name, 'username', p_username),
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO v_auth_id;

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), v_auth_id, v_auth_id::text, 'email',
      jsonb_build_object('sub', v_auth_id::text, 'email', v_email, 'email_verified', true),
      now(), now(), null
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
    WHERE id = v_auth_id;
  END IF;

  INSERT INTO employees (auth_id, username, name, email, role, position, status, account_status, hire_date, salary)
  VALUES (v_auth_id, p_username, p_display_name, v_email, 'member', '', 'active', 'pending', CURRENT_DATE, 0)
  ON CONFLICT (auth_id) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    account_status = 'pending'
  RETURNING id INTO v_emp_id;

  INSERT INTO profiles (auth_id, employee_id, role, bio, skills)
  VALUES (v_auth_id, v_emp_id, 'member', '', '{}')
  ON CONFLICT (auth_id) DO NOTHING;

  INSERT INTO admin_user_credentials (username, auth_email, auth_id, created_by)
  VALUES (p_username, v_email, v_auth_id, auth.uid())
  ON CONFLICT (username) DO UPDATE SET
    auth_id = v_auth_id,
    auth_email = v_email;

  v_result := jsonb_build_object('success', true, 'auth_id', v_auth_id, 'employee_id', v_emp_id);
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_approve_user(p_employee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    v_result := jsonb_build_object('error', 'Only admin can approve accounts');
    RETURN v_result;
  END IF;
  UPDATE employees SET account_status = 'approved' WHERE id = p_employee_id;
  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_user(p_employee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    v_result := jsonb_build_object('error', 'Only admin can reject accounts');
    RETURN v_result;
  END IF;
  UPDATE employees SET account_status = 'rejected' WHERE id = p_employee_id;
  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_user_password(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id uuid;
  v_email text;
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    v_result := jsonb_build_object('error', 'Only admin can reset passwords');
    RETURN v_result;
  END IF;
  IF length(p_password) < 6 THEN
    v_result := jsonb_build_object('error', 'Password must be at least 6 characters');
    RETURN v_result;
  END IF;

  v_email := lower(p_username) || '@afftech.bd';
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;
  IF v_auth_id IS NULL THEN
    v_result := jsonb_build_object('error', 'User not found');
    RETURN v_result;
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
  WHERE id = v_auth_id;

  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION user_complete_profile(
  p_name text,
  p_position text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_skills text[] DEFAULT NULL,
  p_location text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_emp FROM employees WHERE auth_id = auth.uid();
  IF NOT FOUND THEN
    v_result := jsonb_build_object('error', 'Employee record not found');
    RETURN v_result;
  END IF;

  UPDATE employees
  SET name = COALESCE(p_name, name),
      position = COALESCE(p_position, position),
      phone = COALESCE(p_phone, phone)
  WHERE id = v_emp.id;

  UPDATE profiles
  SET bio = COALESCE(p_bio, bio),
      skills = COALESCE(p_skills, skills),
      location = COALESCE(p_location, location)
  WHERE employee_id = v_emp.id;

  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

-- =========================================================
-- 4. Seed the admin account
-- =========================================================
DO $$
DECLARE
  v_auth_id uuid;
  v_email text;
  v_emp_id uuid;
BEGIN
  v_email := 'ahmed.fk.98545@afftech.bd';

  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;
  IF v_auth_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      email_confirmed_at, encrypted_password,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change,
      email_change_token_new, email_change_token_current
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', v_email,
      now(), crypt('01641526137@#$', gen_salt('bf')),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', 'Afferent Tech BD', 'username', 'Ahmed FK 98545'),
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO v_auth_id;

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), v_auth_id, v_auth_id::text, 'email',
      jsonb_build_object('sub', v_auth_id::text, 'email', v_email, 'email_verified', true),
      now(), now(), null
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('01641526137@#$', gen_salt('bf')), updated_at = now()
    WHERE id = v_auth_id;
  END IF;

  INSERT INTO employees (auth_id, username, name, email, role, position, status, account_status, hire_date, salary)
  VALUES (v_auth_id, 'Ahmed FK 98545', 'Afferent Tech BD', v_email, 'admin', 'System Administrator', 'active', 'approved', CURRENT_DATE, 0)
  ON CONFLICT (auth_id) DO UPDATE SET
    username = 'Ahmed FK 98545',
    role = 'admin',
    account_status = 'approved',
    name = 'Afferent Tech BD'
  RETURNING id INTO v_emp_id;

  INSERT INTO profiles (auth_id, employee_id, role, bio, skills)
  VALUES (v_auth_id, v_emp_id, 'admin', 'System Administrator & Founder of Afferent Tech BD', ARRAY['Leadership','Management','Strategy'])
  ON CONFLICT (auth_id) DO NOTHING;

  INSERT INTO admin_user_credentials (username, auth_email, auth_id, created_by)
  VALUES ('Ahmed FK 98545', v_email, v_auth_id, v_auth_id)
  ON CONFLICT (username) DO UPDATE SET auth_id = v_auth_id, auth_email = v_email;
END $$;

-- =========================================================
-- 5. Grant execute on functions
-- =========================================================
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_user(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION user_complete_profile(text, text, text, text, text[], text) TO authenticated;
