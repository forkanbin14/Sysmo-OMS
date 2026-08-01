-- Fix email generation in admin_create_user to replace spaces with dots
-- This matches the signIn logic on the frontend
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

  -- Replace spaces with dots (matches frontend signIn logic)
  v_email := lower(regexp_replace(p_username, '\s+', '.', 'g')) || '@afftech.bd';

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

-- Also fix admin_update_user_password to use same email logic
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

  v_email := lower(regexp_replace(p_username, '\s+', '.', 'g')) || '@afftech.bd';
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
