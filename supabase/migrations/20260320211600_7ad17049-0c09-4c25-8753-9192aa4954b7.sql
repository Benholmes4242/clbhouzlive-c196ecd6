-- Insert the system/bot user into auth.users so the FK chain works
-- auth.users → user_profiles → posts.user_id
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  'b8437384-291a-4d85-b81f-24c1068235dd',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'system@clbhouz.app',
  '',
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user_profiles row
INSERT INTO public.user_profiles (
  id,
  username,
  display_name,
  bio,
  is_public,
  user_type,
  created_at,
  updated_at
)
VALUES (
  'b8437384-291a-4d85-b81f-24c1068235dd',
  'clbhouz',
  'clbhouz',
  'Official tournament updates',
  true,
  'individual',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;