INSERT INTO user_profiles (
  id,
  display_name,
  username,
  is_verified,
  actor_type,
  created_at,
  updated_at
)
VALUES (
  'b8437384-291a-4d85-b81f-24c1068235dd',
  'Clbhouz',
  'clbhouz',
  true,
  'system',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;