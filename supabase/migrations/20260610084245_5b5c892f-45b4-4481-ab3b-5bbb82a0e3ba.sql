create or replace function public.handle_whs_mapping_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evaluator_version constant int := 1;
  v_should_act boolean;
begin
  v_should_act := (
    NEW.reviewed_at is not null
    or coalesce(NEW.match_confidence, 0) >= 0.70
  );

  if not v_should_act then
    return NEW;
  end if;

  update gam_round_stats grs
  set
    course_id   = NEW.golf_course_id,
    course_name = (select name from golf_courses where id = NEW.golf_course_id)
  from whs_scores ws
  where grs.whs_score_id = ws.id
    and ws.course_id     = NEW.whs_course_id
    and grs.course_id    is null;

  update gam_round_stats grs
  set course_name = gc.name
  from whs_scores ws
  join golf_courses gc on gc.id = NEW.golf_course_id
  where grs.whs_score_id = ws.id
    and ws.course_id     = NEW.whs_course_id
    and grs.course_id    = NEW.golf_course_id
    and grs.course_name  is null;

  insert into gam_evaluation_queue (
    user_id, whs_score_id, evaluator_version, status, attempts,
    enqueued_at, processed_at, error
  )
  select
    wc.user_id,
    ws.id,
    v_evaluator_version,
    'queued',
    0,
    now(),
    null,
    null
  from whs_scores ws
  join whs_connections wc on wc.id = ws.connection_id
  where ws.course_id = NEW.whs_course_id
  on conflict (user_id, whs_score_id, evaluator_version)
  do update set
    status       = 'queued',
    attempts     = 0,
    enqueued_at  = now(),
    processed_at = null,
    error        = null;

  return NEW;
end;
$$;

drop trigger if exists trg_handle_whs_mapping_change on public.whs_to_golf_course_map;

create trigger trg_handle_whs_mapping_change
  after insert or update of golf_course_id, match_confidence, reviewed_at
  on public.whs_to_golf_course_map
  for each row
  execute function public.handle_whs_mapping_change();

comment on function public.handle_whs_mapping_change is
  'When a WHS course mapping becomes production-ready (reviewed_at set, or match_confidence >= 0.70), backfill gam_round_stats and re-enqueue affected scores so gam_course_legends gets populated. Fixes the Champions-tab-empty bug for retroactively-mapped courses.';