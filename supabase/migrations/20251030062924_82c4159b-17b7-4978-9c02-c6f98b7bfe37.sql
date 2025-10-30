-- =====================================================
-- MIGRATION: Game System - Phase 2A (Tables Only)
-- =====================================================

-- 1) Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'player',
  state text NOT NULL DEFAULT 'invited',
  reserves_slot boolean NOT NULL DEFAULT false,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_role CHECK (role IN ('host','player')),
  CONSTRAINT chk_state CHECK (state IN ('invited','accepted','declined','removed')),
  CONSTRAINT ux_game_participant UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- 2) Create game_threads table
CREATE TABLE IF NOT EXISTS game_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  grace_hours int NOT NULL DEFAULT 12,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_threads_game ON game_threads(game_id);
CREATE INDEX IF NOT EXISTS idx_game_threads_expiry ON game_threads(expires_at, is_closed);
ALTER TABLE game_threads ENABLE ROW LEVEL SECURITY;

-- 3) Create game_thread_participants table
CREATE TABLE IF NOT EXISTS game_thread_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES game_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('host','player')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_thread_participant UNIQUE (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_participants_thread ON game_thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON game_thread_participants(user_id);
ALTER TABLE game_thread_participants ENABLE ROW LEVEL SECURITY;

-- 4) Create game_thread_messages table
CREATE TABLE IF NOT EXISTS game_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES game_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  text text NOT NULL,
  attachments jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_created ON game_thread_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_messages_sender ON game_thread_messages(sender_id);
ALTER TABLE game_thread_messages ENABLE ROW LEVEL SECURITY;

-- 5) Backfill host participant rows
INSERT INTO game_participants (game_id, user_id, role, state, reserves_slot, joined_at)
SELECT id, host_user_id, 'host', 'accepted', true, created_at
FROM games
ON CONFLICT (game_id, user_id) DO NOTHING;