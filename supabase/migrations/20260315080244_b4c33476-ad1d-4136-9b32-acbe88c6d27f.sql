ALTER TABLE admin_invitations
DROP CONSTRAINT admin_invitations_status_check;

ALTER TABLE admin_invitations
ADD CONSTRAINT admin_invitations_status_check
CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));