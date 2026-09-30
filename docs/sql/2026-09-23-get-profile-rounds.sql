-- THIS FILE MUST MATCH `pg_get_functiondef` FOR THE LIVE FUNCTION.
-- It USED TO DROP before it CREATEd, so a stale copy here was not
-- documentation, it was a script that silently removed columns the app
-- depends on. It previously held an 18-column plpgsql version that had
-- not been live for some time; the live function was a 15-column sql
-- rewrite, and is now this 17-column one. Running the old file on
-- 30 Sep 2026 would have blanked NET, VS HCP and the handicap delta on
-- the profile Scores tab.
--
-- 2026-09-30: body refreshed from pg_get_functiondef (09:37 BST). NET now
-- reads the view public.gam_round_net; gam_round_stats.nett_score is dead.
-- The output column keeps the name nett_score - the front end reads it.
-- The DROP FUNCTION line was removed: this file is CREATE OR REPLACE only and
-- can no longer uninstall the live function.

CREATE OR REPLACE FUNCTION public.get_profile_rounds(p_user_id uuid)
 RETURNS TABLE(whs_score_id uuid, play_date date, course_id uuid, course_name text, course_par integer, gross_score integer, nett_score integer, hcp_at_time numeric, delta_index numeric, is_nine_hole boolean, total_holes integer, handicap_differential numeric, handicap_index_at_time numeric, eagles integer, albatrosses integer, holes_in_one integer, clean_card boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    g.whs_score_id, g.play_date, g.course_id, g.course_name, g.course_par,
    g.gross_score, n.net_score::integer as nett_score, g.hcp_at_time, g.delta_index,
    s.is_nine_hole, s.total_holes, s.handicap_differential, s.handicap_index_at_time,
    g.eagles, g.albatrosses, g.holes_in_one, g.clean_card
  from public.gam_round_stats g
  left join public.whs_scores s on s.id = g.whs_score_id
  left join public.gam_round_net n on n.whs_score_id = g.whs_score_id
  where public.can_view_handicap(auth.uid(), p_user_id)
    and g.user_id = p_user_id
  order by g.play_date desc
  limit 1000;
$function$;

GRANT EXECUTE ON FUNCTION public.get_profile_rounds(uuid) TO authenticated;
