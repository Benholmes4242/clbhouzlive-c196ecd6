-- Enable RLS on user_roles table if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "user_can_read_own_roles" ON public.user_roles;

-- Policy: authenticated users can read their own roles
CREATE POLICY "user_can_read_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add index for performance on role lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

-- Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS user_roles_user_role_idx ON public.user_roles(user_id, role);