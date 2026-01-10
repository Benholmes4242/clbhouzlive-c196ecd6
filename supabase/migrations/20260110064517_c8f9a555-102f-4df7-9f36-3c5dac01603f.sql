-- Add archived_at column to game_participants for user-specific game archiving
ALTER TABLE public.game_participants
ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_game_participants_archived_at ON public.game_participants (archived_at) WHERE archived_at IS NOT NULL;