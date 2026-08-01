/*
# Fix admin auth user — password update + identity row (v4)

## Problem
The admin auth user (ahmedforkan26@gmail.com) was created via direct INSERT
into auth.users, bypassing Supabase Auth's normal signup flow. Two issues:
1. No matching row in auth.identities — Supabase Auth requires an identity
   row. Without it, signInWithPassword returns "Database error querying schema".
2. Password was set to the wrong value.

## Fix
1. Re-create the auth.users row with the correct bcrypt-hashed password
   (01641526137@#$). confirmed_at is a generated column — excluded.
2. Insert the missing auth.identities row (both confirmed_at in auth.users
   and email in auth.identities are generated columns — excluded).
3. Re-create the employees + profiles rows linking to this auth account.
*/

DO $$
DECLARE
  admin_auth_id uuid;
BEGIN
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'ahmedforkan26@gmail.com';

  IF admin_auth_id IS NULL THEN
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
      crypt('01641526137@#$', gen_salt('bf')),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Afferent Tech BD"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_auth_id;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('01641526137@#$', gen_salt('bf')),
        updated_at = now()
    WHERE id = admin_auth_id;
  END IF;

  -- Insert missing identity row (email is generated, excluded)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    gen_random_uuid(),
    admin_auth_id,
    admin_auth_id::text,
    'email',
    jsonb_build_object('sub', admin_auth_id::text, 'email', 'ahmedforkan26@gmail.com', 'email_verified', true),
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Create admin employee row
  INSERT INTO employees (auth_id, name, email, role, position, status, hire_date, salary)
  VALUES (admin_auth_id, 'Afferent Tech BD', 'ahmedforkan26@gmail.com', 'admin', 'System Administrator', 'active', CURRENT_DATE, 0)
  ON CONFLICT (auth_id) DO NOTHING;

  -- Create admin profile
  INSERT INTO profiles (auth_id, employee_id, role, bio, skills)
  SELECT admin_auth_id, e.id, 'admin', 'System Administrator & Founder of Afferent Tech BD', ARRAY['Leadership','Management','Strategy']
  FROM employees e WHERE e.auth_id = admin_auth_id
  ON CONFLICT (auth_id) DO NOTHING;
END $$;

-- Re-seed default app settings if missing
INSERT INTO app_settings (theme_key, accent_color, icon_set, layout_density, sidebar_style, font_family)
SELECT 'atlas-midnight', '#4f46e5', 'lucide', 'comfortable', 'expanded', 'inter'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
