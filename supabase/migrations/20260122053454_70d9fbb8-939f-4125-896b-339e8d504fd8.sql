-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Only service role can manage admin memberships" ON admin_memberships;

-- Create separate policies for proper access control
-- Allow authenticated users to read their own membership (required for admin access check)
CREATE POLICY "Users can read own admin membership"
ON admin_memberships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (via edge functions)
CREATE POLICY "Service role manages admin memberships"
ON admin_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);