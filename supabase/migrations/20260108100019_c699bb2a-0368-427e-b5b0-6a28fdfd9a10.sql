-- 1) Add CHECK constraints for data integrity
ALTER TABLE public.leaderboard_milestones
  ADD CONSTRAINT rank_value_positive CHECK (rank_value > 0);

ALTER TABLE public.leaderboard_milestones
  ADD CONSTRAINT rivals_overtaken_nonnegative CHECK (rivals_overtaken IS NULL OR rivals_overtaken >= 0);

ALTER TABLE public.leaderboard_milestones
  ADD CONSTRAINT percentile_range CHECK (percentile IS NULL OR (percentile BETWEEN 1 AND 100));

-- 2) Remove client INSERT policy - all inserts go through RPC only
DROP POLICY IF EXISTS "milestones_insert_own" ON public.leaderboard_milestones;