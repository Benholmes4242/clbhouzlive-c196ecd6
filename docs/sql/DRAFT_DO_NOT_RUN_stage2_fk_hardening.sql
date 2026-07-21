-- ============================================================================
-- STAGE 2 FK HARDENING — DRAFT, DO NOT RUN YET
-- ============================================================================
-- Location note: parked in docs/sql/ (not supabase/migrations/) because the
-- migrations folder auto-applies. This file is REVIEW-ONLY. When approved,
-- promote via the migration tool during the scheduled window.
--
-- Purpose:
--   Replace 25 legacy `NO ACTION` foreign keys pointing at auth.users /
--   public.user_profiles with the correct cascade / set-null semantics so
--   that `auth.admin.deleteUser` (Branch C) succeeds without pre-cleanup.
--
-- RUN INSTRUCTIONS (when scheduled — NOT NOW):
--   1. Schedule during a low-traffic window (target: overnight UTC, later
--      this week). post_views is the highest-write table and is the
--      LAST statement inside the transaction.
--   2. Execute the whole file as a single transaction (BEGIN … COMMIT).
--   3. Immediately after commit, run ONE `auth.admin.deleteUser` against
--      a disposable TEST user to verify cascades / SET NULLs fire
--      end-to-end.
--   4. Only after that verification passes, ship the SEPARATE cleanup
--      brief which removes the six now-redundant pre-cleanup DELETEs
--      from the `secure-admin-operations` edge function. The edge
--      function is unchanged by this migration (ping version unchanged).
--
-- CORRECTIONS APPLIED (vs. the prep-audit draft):
--   • review_responses.responded_by  → SET NULL (was CASCADE).
--     Rationale: review responses are public business content and must
--     survive the responder's deletion. Needs DROP NOT NULL first.
--   • business_analytics_events.user_id → CASCADE (was SET NULL).
--     Rationale: matches the live secure-admin-operations pre-cleanup
--     which DELETEs these rows today; constraint must agree with
--     shipped behaviour.
--   • course_edit_suggestions.suggested_by → SET NULL (was CASCADE).
--     Rationale: catalogue contributions keep the record; anonymise
--     the author only. Needs DROP NOT NULL first.
--
-- PODIUM DECISION (Ben, confirmed):
--   • season_podium_archive first/second/third_place_user_id → SET NULL.
--     Season rows survive; winners anonymise. Needs DROP NOT NULL on
--     first_place_user_id only.
--
-- TALLY (per brief): 7 CASCADE (own-data six + none added beyond),
--   15 SET NULL actor (with the 5 + 2 DROP NOT NULLs),
--   3 podium SET NULL — every one of the 25 accounted for.
-- ============================================================================

BEGIN;

-- =========================================================================
-- OWN-DATA → CASCADE (zero-row / low-write tables first)
-- =========================================================================
ALTER TABLE public.user_courses
  DROP CONSTRAINT user_courses_user_id_fkey,
  ADD  CONSTRAINT user_courses_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_top100_courses
  DROP CONSTRAINT user_top100_courses_user_id_fkey,
  ADD  CONSTRAINT user_top100_courses_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.creator_profile_events
  DROP CONSTRAINT creator_profile_events_user_id_fkey,
  ADD  CONSTRAINT creator_profile_events_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profile_analytics_events
  DROP CONSTRAINT creator_analytics_events_user_id_fkey,
  ADD  CONSTRAINT creator_analytics_events_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =========================================================================
-- ADMIN-ACTOR → SET NULL (already-nullable columns)
-- =========================================================================
ALTER TABLE public.admin_memberships
  DROP CONSTRAINT admin_memberships_granted_by_fkey,
  ADD  CONSTRAINT admin_memberships_granted_by_fkey
       FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.business_accounts
  DROP CONSTRAINT business_accounts_verified_by_fkey,
  ADD  CONSTRAINT business_accounts_verified_by_fkey
       FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.business_activity_log
  DROP CONSTRAINT business_activity_log_actor_user_id_fkey,
  ADD  CONSTRAINT business_activity_log_actor_user_id_fkey
       FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.business_tag_visibility
  DROP CONSTRAINT business_tag_visibility_hidden_by_fkey,
  ADD  CONSTRAINT business_tag_visibility_hidden_by_fkey
       FOREIGN KEY (hidden_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.business_verification_requests
  DROP CONSTRAINT business_verification_requests_reviewed_by_fkey,
  ADD  CONSTRAINT business_verification_requests_reviewed_by_fkey
       FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.course_claim_requests
  DROP CONSTRAINT course_claim_requests_reviewed_by_fkey,
  ADD  CONSTRAINT course_claim_requests_reviewed_by_fkey
       FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.course_edit_suggestions
  DROP CONSTRAINT course_edit_suggestions_reviewed_by_fkey,
  ADD  CONSTRAINT course_edit_suggestions_reviewed_by_fkey
       FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.golfer_verification_requests
  DROP CONSTRAINT golfer_verification_requests_second_approval_bypassed_by_fkey,
  ADD  CONSTRAINT golfer_verification_requests_second_approval_bypassed_by_fkey
       FOREIGN KEY (second_approval_bypassed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT posts_pinned_by_fkey,
  ADD  CONSTRAINT posts_pinned_by_fkey
       FOREIGN KEY (pinned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =========================================================================
-- ADMIN-ACTOR → SET NULL (DROP NOT NULL required first) — original 5
-- =========================================================================
ALTER TABLE public.business_team_members ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.business_team_members
  DROP CONSTRAINT business_team_members_created_by_fkey,
  ADD  CONSTRAINT business_team_members_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.golfer_candidate_overrides ALTER COLUMN acted_by DROP NOT NULL;
ALTER TABLE public.golfer_candidate_overrides
  DROP CONSTRAINT golfer_candidate_overrides_acted_by_fkey,
  ADD  CONSTRAINT golfer_candidate_overrides_acted_by_fkey
       FOREIGN KEY (acted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.golfer_verification_invites ALTER COLUMN invited_by DROP NOT NULL;
ALTER TABLE public.golfer_verification_invites
  DROP CONSTRAINT golfer_verification_invites_invited_by_fkey,
  ADD  CONSTRAINT golfer_verification_invites_invited_by_fkey
       FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.golfer_verification_requests ALTER COLUMN invited_by DROP NOT NULL;
ALTER TABLE public.golfer_verification_requests
  DROP CONSTRAINT golfer_verification_requests_invited_by_fkey,
  ADD  CONSTRAINT golfer_verification_requests_invited_by_fkey
       FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.golfer_verification_reviews ALTER COLUMN reviewer_id DROP NOT NULL;
ALTER TABLE public.golfer_verification_reviews
  DROP CONSTRAINT golfer_verification_reviews_reviewer_id_fkey,
  ADD  CONSTRAINT golfer_verification_reviews_reviewer_id_fkey
       FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =========================================================================
-- CORRECTIONS: 2 additional SET NULL columns (DROP NOT NULL first)
--   • course_edit_suggestions.suggested_by — was CASCADE in prep audit
--   • review_responses.responded_by        — was CASCADE in prep audit
-- =========================================================================
ALTER TABLE public.course_edit_suggestions ALTER COLUMN suggested_by DROP NOT NULL;
ALTER TABLE public.course_edit_suggestions
  DROP CONSTRAINT course_edit_suggestions_suggested_by_fkey,
  ADD  CONSTRAINT course_edit_suggestions_suggested_by_fkey
       FOREIGN KEY (suggested_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.review_responses ALTER COLUMN responded_by DROP NOT NULL;
ALTER TABLE public.review_responses
  DROP CONSTRAINT review_responses_responded_by_fkey,
  ADD  CONSTRAINT review_responses_responded_by_fkey
       FOREIGN KEY (responded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =========================================================================
-- PODIUM (Ben) → SET NULL. DROP NOT NULL on first_place_user_id only.
-- =========================================================================
ALTER TABLE public.season_podium_archive ALTER COLUMN first_place_user_id DROP NOT NULL;

ALTER TABLE public.season_podium_archive
  DROP CONSTRAINT season_podium_archive_first_place_user_id_fkey,
  ADD  CONSTRAINT season_podium_archive_first_place_user_id_fkey
       FOREIGN KEY (first_place_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.season_podium_archive
  DROP CONSTRAINT season_podium_archive_second_place_user_id_fkey,
  ADD  CONSTRAINT season_podium_archive_second_place_user_id_fkey
       FOREIGN KEY (second_place_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.season_podium_archive
  DROP CONSTRAINT season_podium_archive_third_place_user_id_fkey,
  ADD  CONSTRAINT season_podium_archive_third_place_user_id_fkey
       FOREIGN KEY (third_place_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =========================================================================
-- CORRECTION: business_analytics_events → CASCADE (was SET NULL).
-- Grouped with the analytics-adjacent statements, ahead of the
-- highest-write table.
-- =========================================================================
ALTER TABLE public.business_analytics_events
  DROP CONSTRAINT business_analytics_events_user_id_fkey,
  ADD  CONSTRAINT business_analytics_events_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =========================================================================
-- HIGH-WRITE — absolute LAST statement in the window.
-- =========================================================================
ALTER TABLE public.post_views
  DROP CONSTRAINT post_views_viewer_id_fkey,
  ADD  CONSTRAINT post_views_viewer_id_fkey
       FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;

-- ============================================================================
-- POST-RUN CHECKLIST
--   [ ] Run one auth.admin.deleteUser against a disposable TEST account.
--   [ ] Confirm cascades fired (own-data rows gone) and SET NULLs fired
--       (actor columns now NULL on retained rows).
--   [ ] Ship the separate cleanup brief that removes the six pre-cleanup
--       DELETE statements from secure-admin-operations edge function.
-- ============================================================================
