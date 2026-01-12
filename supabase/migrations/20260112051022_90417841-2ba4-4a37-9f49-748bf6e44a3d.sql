-- ============================================================
-- Migration: Add public read access to all sr_* (Sportradar) tables
-- Purpose: Allow all users to read tour data, not just admins
-- ============================================================

-- 1. sr_players - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_players" ON public.sr_players;
DROP POLICY IF EXISTS "Public read access for sr_players" ON public.sr_players;
CREATE POLICY "Public read access for sr_players" ON public.sr_players
  FOR SELECT USING (true);

-- 2. sr_player_statistics - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_player_statistics" ON public.sr_player_statistics;
DROP POLICY IF EXISTS "Public read access for sr_player_statistics" ON public.sr_player_statistics;
CREATE POLICY "Public read access for sr_player_statistics" ON public.sr_player_statistics
  FOR SELECT USING (true);

-- 3. sr_player_profiles - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_player_profiles" ON public.sr_player_profiles;
DROP POLICY IF EXISTS "Public read access for sr_player_profiles" ON public.sr_player_profiles;
CREATE POLICY "Public read access for sr_player_profiles" ON public.sr_player_profiles
  FOR SELECT USING (true);

-- 4. sr_seasons - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_seasons" ON public.sr_seasons;
DROP POLICY IF EXISTS "Public read access for sr_seasons" ON public.sr_seasons;
CREATE POLICY "Public read access for sr_seasons" ON public.sr_seasons
  FOR SELECT USING (true);

-- 5. sr_tournaments - Update to allow public read
DROP POLICY IF EXISTS "Admin read access for sr_tournaments" ON public.sr_tournaments;
DROP POLICY IF EXISTS "Public read featured tournaments" ON public.sr_tournaments;
DROP POLICY IF EXISTS "Public read access for sr_tournaments" ON public.sr_tournaments;
CREATE POLICY "Public read access for sr_tournaments" ON public.sr_tournaments
  FOR SELECT USING (true);

-- 6. sr_leaderboards - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_leaderboards" ON public.sr_leaderboards;
DROP POLICY IF EXISTS "Public read access for sr_leaderboards" ON public.sr_leaderboards;
CREATE POLICY "Public read access for sr_leaderboards" ON public.sr_leaderboards
  FOR SELECT USING (true);

-- 7. sr_world_rankings - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_world_rankings" ON public.sr_world_rankings;
DROP POLICY IF EXISTS "Public read access for sr_world_rankings" ON public.sr_world_rankings;
CREATE POLICY "Public read access for sr_world_rankings" ON public.sr_world_rankings
  FOR SELECT USING (true);

-- 8. sr_scorecards - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_scorecards" ON public.sr_scorecards;
DROP POLICY IF EXISTS "Public read access for sr_scorecards" ON public.sr_scorecards;
CREATE POLICY "Public read access for sr_scorecards" ON public.sr_scorecards
  FOR SELECT USING (true);

-- 9. sr_courses - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_courses" ON public.sr_courses;
DROP POLICY IF EXISTS "Public read access for sr_courses" ON public.sr_courses;
CREATE POLICY "Public read access for sr_courses" ON public.sr_courses
  FOR SELECT USING (true);

-- 10. sr_tee_times - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_tee_times" ON public.sr_tee_times;
DROP POLICY IF EXISTS "Public read access for sr_tee_times" ON public.sr_tee_times;
CREATE POLICY "Public read access for sr_tee_times" ON public.sr_tee_times
  FOR SELECT USING (true);

-- 11. sr_tournament_summaries - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_tournament_summaries" ON public.sr_tournament_summaries;
DROP POLICY IF EXISTS "Public read access for sr_tournament_summaries" ON public.sr_tournament_summaries;
CREATE POLICY "Public read access for sr_tournament_summaries" ON public.sr_tournament_summaries
  FOR SELECT USING (true);

-- 12. sr_course_holes - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_course_holes" ON public.sr_course_holes;
DROP POLICY IF EXISTS "Public read access for sr_course_holes" ON public.sr_course_holes;
CREATE POLICY "Public read access for sr_course_holes" ON public.sr_course_holes
  FOR SELECT USING (true);

-- 13. sr_hole_statistics - Drop admin-only policy, add public read
DROP POLICY IF EXISTS "Admin read access for sr_hole_statistics" ON public.sr_hole_statistics;
DROP POLICY IF EXISTS "Public read access for sr_hole_statistics" ON public.sr_hole_statistics;
CREATE POLICY "Public read access for sr_hole_statistics" ON public.sr_hole_statistics
  FOR SELECT USING (true);

-- ============================================================
-- Ensure admin INSERT/UPDATE/DELETE policies exist on all tables
-- ============================================================

-- sr_players admin write
DROP POLICY IF EXISTS "Admin write access for sr_players" ON public.sr_players;
CREATE POLICY "Admin write access for sr_players" ON public.sr_players
  FOR ALL USING (public.is_admin());

-- sr_player_statistics admin write
DROP POLICY IF EXISTS "Admin write access for sr_player_statistics" ON public.sr_player_statistics;
CREATE POLICY "Admin write access for sr_player_statistics" ON public.sr_player_statistics
  FOR ALL USING (public.is_admin());

-- sr_player_profiles admin write
DROP POLICY IF EXISTS "Admin write access for sr_player_profiles" ON public.sr_player_profiles;
CREATE POLICY "Admin write access for sr_player_profiles" ON public.sr_player_profiles
  FOR ALL USING (public.is_admin());

-- sr_seasons admin write
DROP POLICY IF EXISTS "Admin write access for sr_seasons" ON public.sr_seasons;
CREATE POLICY "Admin write access for sr_seasons" ON public.sr_seasons
  FOR ALL USING (public.is_admin());

-- sr_tournaments admin write
DROP POLICY IF EXISTS "Admin write access for sr_tournaments" ON public.sr_tournaments;
CREATE POLICY "Admin write access for sr_tournaments" ON public.sr_tournaments
  FOR ALL USING (public.is_admin());

-- sr_leaderboards admin write
DROP POLICY IF EXISTS "Admin write access for sr_leaderboards" ON public.sr_leaderboards;
CREATE POLICY "Admin write access for sr_leaderboards" ON public.sr_leaderboards
  FOR ALL USING (public.is_admin());

-- sr_world_rankings admin write
DROP POLICY IF EXISTS "Admin write access for sr_world_rankings" ON public.sr_world_rankings;
CREATE POLICY "Admin write access for sr_world_rankings" ON public.sr_world_rankings
  FOR ALL USING (public.is_admin());

-- sr_scorecards admin write
DROP POLICY IF EXISTS "Admin write access for sr_scorecards" ON public.sr_scorecards;
CREATE POLICY "Admin write access for sr_scorecards" ON public.sr_scorecards
  FOR ALL USING (public.is_admin());

-- sr_courses admin write
DROP POLICY IF EXISTS "Admin write access for sr_courses" ON public.sr_courses;
CREATE POLICY "Admin write access for sr_courses" ON public.sr_courses
  FOR ALL USING (public.is_admin());

-- sr_tee_times admin write
DROP POLICY IF EXISTS "Admin write access for sr_tee_times" ON public.sr_tee_times;
CREATE POLICY "Admin write access for sr_tee_times" ON public.sr_tee_times
  FOR ALL USING (public.is_admin());

-- sr_tournament_summaries admin write
DROP POLICY IF EXISTS "Admin write access for sr_tournament_summaries" ON public.sr_tournament_summaries;
CREATE POLICY "Admin write access for sr_tournament_summaries" ON public.sr_tournament_summaries
  FOR ALL USING (public.is_admin());

-- sr_course_holes admin write
DROP POLICY IF EXISTS "Admin write access for sr_course_holes" ON public.sr_course_holes;
CREATE POLICY "Admin write access for sr_course_holes" ON public.sr_course_holes
  FOR ALL USING (public.is_admin());

-- sr_hole_statistics admin write
DROP POLICY IF EXISTS "Admin write access for sr_hole_statistics" ON public.sr_hole_statistics;
CREATE POLICY "Admin write access for sr_hole_statistics" ON public.sr_hole_statistics
  FOR ALL USING (public.is_admin());