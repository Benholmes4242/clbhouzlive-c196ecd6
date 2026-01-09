-- =============================================
-- TRIPS TABLE
-- =============================================
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  visibility text NOT NULL DEFAULT 'friends' CHECK (visibility IN ('invite', 'friends', 'club')),
  cover_image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_trips_created_by ON public.trips(created_by, start_date DESC);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);

CREATE POLICY "Users can view trips they created"
  ON public.trips FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = created_by);

-- =============================================
-- TRIP PARTICIPANTS
-- =============================================
CREATE TABLE public.trip_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('organizer', 'member')),
  rsvp_status text NOT NULL DEFAULT 'invited' CHECK (rsvp_status IN ('going', 'maybe', 'declined', 'invited')),
  rsvp_updated_at timestamptz,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_trip_participants_trip ON public.trip_participants(trip_id, rsvp_status);
CREATE INDEX idx_trip_participants_user ON public.trip_participants(user_id, created_at DESC);

CREATE POLICY "Users can view trip participants"
  ON public.trip_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()) OR
    trip_id IN (SELECT trip_id FROM public.trip_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Trip creators can insert participants"
  ON public.trip_participants FOR INSERT
  WITH CHECK (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own participation"
  ON public.trip_participants FOR UPDATE
  USING (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "Trip creators can delete participants"
  ON public.trip_participants FOR DELETE
  USING (trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()));

-- =============================================
-- ADD COLUMNS TO GAMES TABLE
-- =============================================
ALTER TABLE public.games 
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

CREATE INDEX idx_games_trip ON public.games(trip_id, start_time DESC);

-- =============================================
-- GAME REMINDERS TABLE
-- =============================================
CREATE TABLE public.game_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  remind_24h boolean NOT NULL DEFAULT true,
  remind_2h boolean NOT NULL DEFAULT true,
  last_24h_sent_at timestamptz,
  last_2h_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

ALTER TABLE public.game_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_game_reminders_user ON public.game_reminders(user_id, enabled);
CREATE INDEX idx_game_reminders_game ON public.game_reminders(game_id, enabled);

CREATE POLICY "Users can view own reminders"
  ON public.game_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own reminders"
  ON public.game_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reminders"
  ON public.game_reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders"
  ON public.game_reminders FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- UPDATE TRIGGER FOR TRIPS
-- =============================================
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();