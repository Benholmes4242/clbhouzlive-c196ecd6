
-- 1. Add invited_user_id column to admin_invitations
ALTER TABLE admin_invitations
ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add index for lookup by invited user
CREATE INDEX IF NOT EXISTS idx_admin_invitations_invited_user_id
ON admin_invitations(invited_user_id);

-- 3. Make email nullable since in-app invites target user_id, not email
ALTER TABLE admin_invitations
ALTER COLUMN email DROP NOT NULL;
