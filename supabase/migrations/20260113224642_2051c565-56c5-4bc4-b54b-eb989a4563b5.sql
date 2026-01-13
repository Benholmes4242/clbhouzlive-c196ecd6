-- ============================================
-- EVENTS SYSTEM SCHEMA
-- ============================================

-- 1. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_type TEXT NOT NULL DEFAULT 'single_round' 
    CHECK (event_type IN ('single_round', 'society_day', 'multi_day', 'tournament')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  scoring_format TEXT DEFAULT 'stableford'
    CHECK (scoring_format IN ('stroke_gross', 'stroke_net', 'stableford', 'modified_stableford', 'match_play', 'skins', 'best_ball', 'none')),
  handicap_allowance INTEGER DEFAULT 100,
  max_handicap INTEGER DEFAULT 36,
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  allow_waitlist BOOLEAN DEFAULT true,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'friends', 'club', 'invite_only', 'private')),
  created_by UUID NOT NULL,
  club_id UUID REFERENCES public.golf_clubs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex')
);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_share_code ON events(share_code);

-- 2. EVENT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  role TEXT NOT NULL DEFAULT 'player'
    CHECK (role IN ('organizer', 'co_organizer', 'player', 'spectator', 'caddie')),
  invitation_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (invitation_status IN ('invited', 'accepted', 'declined', 'waitlisted', 'removed')),
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  handicap_index NUMERIC(3,1),
  playing_handicap INTEGER,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
  amount_due NUMERIC(10,2),
  amount_paid NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_participant_user_or_guest CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL),
  CONSTRAINT unique_event_user UNIQUE NULLS NOT DISTINCT (event_id, user_id),
  CONSTRAINT unique_event_guest_email UNIQUE NULLS NOT DISTINCT (event_id, guest_email)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- 3. EVENT ROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.event_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.golf_courses(id),
  course_name TEXT NOT NULL,
  course_location TEXT,
  round_number INTEGER NOT NULL DEFAULT 1,
  round_date DATE NOT NULL,
  first_tee_time TIME NOT NULL,
  tee_time_interval INTEGER NOT NULL DEFAULT 8,
  tee_color TEXT,
  course_rating NUMERIC(4,1),
  slope_rating INTEGER,
  par INTEGER DEFAULT 72,
  holes INTEGER NOT NULL DEFAULT 18 CHECK (holes IN (9, 18)),
  shotgun_start BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  legacy_game_id UUID REFERENCES public.games(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_round_number UNIQUE (event_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_event_rounds_event ON event_rounds(event_id);

-- 4. TEE TIME GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.tee_time_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES event_rounds(id) ON DELETE CASCADE,
  group_number INTEGER NOT NULL,
  tee_time TIME NOT NULL,
  starting_hole INTEGER DEFAULT 1,
  group_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'on_course', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_round_group_number UNIQUE (round_id, group_number),
  CONSTRAINT unique_round_tee_time UNIQUE (round_id, tee_time)
);

CREATE INDEX IF NOT EXISTS idx_tee_time_groups_round ON tee_time_groups(round_id);

-- 5. TEE TIME GROUP PLAYERS
CREATE TABLE IF NOT EXISTS public.tee_time_group_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES tee_time_groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  playing_handicap INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_group_participant UNIQUE (group_id, participant_id),
  CONSTRAINT unique_group_position UNIQUE (group_id, position)
);

CREATE INDEX IF NOT EXISTS idx_group_players_group ON tee_time_group_players(group_id);

-- 6. SCORES TABLE
CREATE TABLE IF NOT EXISTS public.event_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES event_rounds(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  group_id UUID REFERENCES tee_time_groups(id) ON DELETE SET NULL,
  hole_scores JSONB,
  front_nine_gross INTEGER,
  back_nine_gross INTEGER,
  total_gross INTEGER,
  total_net INTEGER,
  stableford_points INTEGER,
  holes_won INTEGER,
  holes_lost INTEGER,
  holes_halved INTEGER,
  scorecard_image_url TEXT,
  attested_by UUID REFERENCES event_participants(id),
  attested_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'verified', 'disqualified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_round_participant_score UNIQUE (round_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_event_scores_round ON event_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_participant ON event_scores(participant_id);

-- 7. EVENT LEADERBOARD
CREATE TABLE IF NOT EXISTS public.event_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  rounds_played INTEGER DEFAULT 0,
  total_gross INTEGER DEFAULT 0,
  total_net INTEGER DEFAULT 0,
  total_stableford INTEGER DEFAULT 0,
  position_gross INTEGER,
  position_net INTEGER,
  position_stableford INTEGER,
  movement INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_participant_leaderboard UNIQUE (event_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_event ON event_leaderboard(event_id);

-- RLS POLICIES
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_time_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_time_group_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_leaderboard ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events viewable by participants and public" ON events FOR SELECT
  USING (visibility = 'public' OR created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM event_participants ep WHERE ep.event_id = id AND ep.user_id = auth.uid()
  ));

CREATE POLICY "Events creatable by authenticated users" ON events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Events updatable by organizers" ON events FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM event_participants ep WHERE ep.event_id = id AND ep.user_id = auth.uid() AND ep.role IN ('organizer', 'co_organizer')
  ));

CREATE POLICY "Events deletable by creator" ON events FOR DELETE USING (created_by = auth.uid());

-- Participants policies
CREATE POLICY "Participants viewable by event members" ON event_participants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND (e.created_by = auth.uid() OR e.visibility = 'public')
  ));

CREATE POLICY "Participants insertable by organizers" ON event_participants FOR INSERT
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Participants updatable by self or organizers" ON event_participants FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Participants deletable by organizers" ON event_participants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid()
  ));

-- Rounds policies
CREATE POLICY "Rounds viewable by all" ON event_rounds FOR SELECT USING (true);
CREATE POLICY "Rounds manageable by organizers" ON event_rounds FOR ALL
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.created_by = auth.uid()));

-- Groups policies
CREATE POLICY "Groups viewable by all" ON tee_time_groups FOR SELECT USING (true);
CREATE POLICY "Groups manageable by round organizers" ON tee_time_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM event_rounds er JOIN events e ON e.id = er.event_id 
    WHERE er.id = round_id AND e.created_by = auth.uid()
  ));

-- Group players policies
CREATE POLICY "Group players viewable by all" ON tee_time_group_players FOR SELECT USING (true);
CREATE POLICY "Group players manageable by organizers" ON tee_time_group_players FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tee_time_groups ttg 
    JOIN event_rounds er ON er.id = ttg.round_id 
    JOIN events e ON e.id = er.event_id 
    WHERE ttg.id = group_id AND e.created_by = auth.uid()
  ));

-- Scores policies
CREATE POLICY "Scores viewable by all" ON event_scores FOR SELECT USING (true);
CREATE POLICY "Scores manageable by participant or organizers" ON event_scores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM event_participants ep 
    JOIN events e ON e.id = ep.event_id 
    WHERE ep.id = participant_id AND (ep.user_id = auth.uid() OR e.created_by = auth.uid())
  ));

-- Leaderboard policies
CREATE POLICY "Leaderboard viewable by all" ON event_leaderboard FOR SELECT USING (true);

-- HELPER FUNCTION: Generate tee time groups
CREATE OR REPLACE FUNCTION generate_tee_time_groups(p_round_id UUID, p_players_per_group INTEGER DEFAULT 4)
RETURNS INTEGER AS $$
DECLARE
  v_round RECORD;
  v_participant RECORD;
  v_current_group INTEGER := 1;
  v_current_position INTEGER := 1;
  v_current_tee_time TIME;
  v_current_group_id UUID;
  v_groups_created INTEGER := 0;
BEGIN
  SELECT * INTO v_round FROM event_rounds WHERE id = p_round_id;
  IF v_round IS NULL THEN RAISE EXCEPTION 'Round not found'; END IF;
  
  DELETE FROM tee_time_groups WHERE round_id = p_round_id;
  v_current_tee_time := v_round.first_tee_time;
  
  FOR v_participant IN 
    SELECT ep.id as participant_id FROM event_participants ep
    WHERE ep.event_id = v_round.event_id AND ep.invitation_status = 'accepted'
    ORDER BY ep.handicap_index ASC NULLS LAST, ep.created_at ASC
  LOOP
    IF v_current_position = 1 THEN
      INSERT INTO tee_time_groups (round_id, group_number, tee_time)
      VALUES (p_round_id, v_current_group, v_current_tee_time) RETURNING id INTO v_current_group_id;
      v_groups_created := v_groups_created + 1;
    END IF;
    
    INSERT INTO tee_time_group_players (group_id, participant_id, position)
    VALUES (v_current_group_id, v_participant.participant_id, v_current_position);
    
    IF v_current_position >= p_players_per_group THEN
      v_current_group := v_current_group + 1;
      v_current_position := 1;
      v_current_tee_time := v_current_tee_time + (v_round.tee_time_interval || ' minutes')::INTERVAL;
    ELSE
      v_current_position := v_current_position + 1;
    END IF;
  END LOOP;
  
  RETURN v_groups_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger for events
CREATE OR REPLACE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();