create or replace function public.tournament_scoring_totals(t_id uuid)
returns table (
  eagles_or_better bigint,
  birdies bigint,
  pars bigint,
  bogeys_plus bigint,
  holes_played bigint
)
language sql stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where score_to_par <= -2) as eagles_or_better,
    count(*) filter (where score_to_par = -1)  as birdies,
    count(*) filter (where score_to_par = 0)   as pars,
    count(*) filter (where score_to_par >= 1)  as bogeys_plus,
    count(*)                                    as holes_played
  from public.sr_scorecards
  where tournament_id = t_id
    and score_to_par is not null;
$$;

grant execute on function public.tournament_scoring_totals(uuid) to anon, authenticated, service_role;