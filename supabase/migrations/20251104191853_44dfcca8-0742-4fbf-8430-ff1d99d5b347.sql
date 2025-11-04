-- Performance indexes for chat history queries
-- These improve query speed for both old and new stores

-- Legacy conversations table
CREATE INDEX IF NOT EXISTS conversations_user_updated_idx
  ON conversations (user_id, updated_at DESC) 
  WHERE conversation_type = 'chat';

-- New echo tables
CREATE INDEX IF NOT EXISTS echo_messages_user_created_idx
  ON echo_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS echo_threads_user_updated_idx
  ON echo_threads (user_id, updated_at DESC);

-- Note: RLS policies already exist from previous migration
-- Backfill script is provided separately as a comment for manual execution when ready