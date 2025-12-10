-- Add soft-delete column for notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Create index for efficient querying of non-deleted notifications
CREATE INDEX IF NOT EXISTS idx_notifications_not_deleted 
ON notifications(user_id, is_deleted) 
WHERE is_deleted = false;