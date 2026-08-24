create or replace function public.get_live_course_record_facts(p_score_ids uuid[])
returns table (
  score_id uuid,
  beaten_gross integer,
  held_by text
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select
      g.whs_score_id,
      g.course_id,
      g.user_id,
      g.play_date,
      g.created_at,
      g.gross_score,
      min(
        lpad(g.gross_score::text, 6, '0') || '|' ||
        lpad((extract(epoch from g.created_at) * 1000000)::bigint::text, 20, '0') || '|' ||
        g.whs_score_id::text || '|' || g.user_id::text
      ) over (
        partition by g.course_id
        order by g.play_date, g.created_at, g.whs_score_id
        rows between unbounded preceding and 1 preceding
      ) as prior_record_payload,
      min(g.gross_score) over (partition by g.course_id) as live_best_gross
    from public.gam_round_stats g
    where g.course_id is not null
      and g.gross_score is not null
      and g.holes_played = 18
  ), facts as (
    select
      e.whs_score_id as score_id,
      split_part(e.prior_record_payload, '|', 1)::integer as beaten_gross,
      split_part(e.prior_record_payload, '|', 4)::uuid as prior_holder_id,
      e.gross_score,
      e.live_best_gross
    from eligible e
    where e.whs_score_id = any(coalesce(p_score_ids, array[]::uuid[]))
      and e.prior_record_payload is not null
      and e.gross_score < split_part(e.prior_record_payload, '|', 1)::integer
      and e.gross_score = e.live_best_gross
      and (
        e.user_id = auth.uid()
        or public.can_view_handicap(auth.uid(), e.user_id)
        or public.whs_score_publicly_visible(e.whs_score_id)
      )
  )
  select
    f.score_id,
    f.beaten_gross,
    case when p.deleted_at is null then nullif(btrim(p.display_name), '') else null end as held_by
  from facts f
  left join public.user_profiles p on p.id = f.prior_holder_id;
$$;

revoke all on function public.get_live_course_record_facts(uuid[]) from public;
grant execute on function public.get_live_course_record_facts(uuid[]) to authenticated;
grant execute on function public.get_live_course_record_facts(uuid[]) to service_role;

comment on function public.get_live_course_record_facts(uuid[]) is
  'Returns live clbhouz course-record facts for visible requested rounds. A record must strictly beat an earlier gross on the exact course_id; first rounds and ties do not qualify.';