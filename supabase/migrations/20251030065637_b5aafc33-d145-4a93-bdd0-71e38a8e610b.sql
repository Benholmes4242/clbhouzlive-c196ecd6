-- Enable RLS on all game-related tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_thread_messages ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Anyone can view active public games"
  ON public.games FOR SELECT
  USING (status = 'active' AND visibility = 'public' AND expires_at > now());

CREATE POLICY "Users can view their own games"
  ON public.games FOR SELECT
  USING (host_user_id = auth.uid());

CREATE POLICY "Hosts can create games"
  ON public.games FOR INSERT
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Hosts can update their games"
  ON public.games FOR UPDATE
  USING (host_user_id = auth.uid());

CREATE POLICY "Hosts can delete their games"
  ON public.games FOR DELETE
  USING (host_user_id = auth.uid());

-- Game participants policies
CREATE POLICY "Participants can view their own participation"
  ON public.game_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Hosts can view participants in their games"
  ON public.game_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_participants.game_id
      AND games.host_user_id = auth.uid()
  ));

CREATE POLICY "Hosts can manage participants"
  ON public.game_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_participants.game_id
      AND games.host_user_id = auth.uid()
  ));

-- Game threads policies
CREATE POLICY "Participants can view their game threads"
  ON public.game_threads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_thread_participants gtp
    WHERE gtp.thread_id = game_threads.id
      AND gtp.user_id = auth.uid()
  ));

CREATE POLICY "System can manage threads"
  ON public.game_threads FOR ALL
  USING (true);

-- Game thread participants policies
CREATE POLICY "Users can view thread participants"
  ON public.game_thread_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_thread_participants gtp2
    WHERE gtp2.thread_id = game_thread_participants.thread_id
      AND gtp2.user_id = auth.uid()
  ));

CREATE POLICY "System can manage thread participants"
  ON public.game_thread_participants FOR ALL
  USING (true);

-- Game thread messages policies
CREATE POLICY "Thread participants can view messages"
  ON public.game_thread_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_thread_participants gtp
    WHERE gtp.thread_id = game_thread_messages.thread_id
      AND gtp.user_id = auth.uid()
  ));

CREATE POLICY "Thread participants can send messages"
  ON public.game_thread_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.game_thread_participants gtp
      WHERE gtp.thread_id = game_thread_messages.thread_id
        AND gtp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.game_thread_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.game_thread_messages FOR DELETE
  USING (sender_id = auth.uid());