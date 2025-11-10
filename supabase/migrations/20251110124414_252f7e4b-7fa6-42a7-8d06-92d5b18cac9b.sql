-- Ensure admin_memberships table has all required columns (idempotent)

-- Make sure the table exists with the expected columns
CREATE TABLE IF NOT EXISTS admin_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('full','limited')) NOT NULL
);

-- Add expires_at if missing
ALTER TABLE admin_memberships
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

-- (Optional) provenance fields used by admin tools
ALTER TABLE admin_memberships
  ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes text NULL;

-- Add helpful comment
COMMENT ON TABLE admin_memberships IS 'Tracks admin role assignments with optional expiration';
COMMENT ON COLUMN admin_memberships.expires_at IS 'When null, role never expires. When set, role is only active before this timestamp.';
COMMENT ON COLUMN admin_memberships.granted_by IS 'User ID who granted this admin role';