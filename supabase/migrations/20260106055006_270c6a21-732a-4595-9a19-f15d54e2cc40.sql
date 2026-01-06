create or replace function public.reorder_top_ten_courses(
  p_user_id uuid,
  p_course_ids uuid[]
)
returns void
language plpgsql
security definer
as $$
begin
  if array_length(p_course_ids, 1) is null then
    return;
  end if;

  -- Move out of the 1-10 range to avoid (user_id, position) collisions
  update public.user_top_ten_courses
  set position = position + 100
  where user_id = p_user_id;

  -- Apply final positions (1..N)
  update public.user_top_ten_courses utc
  set position = v.new_pos
  from (
    select
      unnest(p_course_ids) as course_id,
      generate_subscripts(p_course_ids, 1) as new_pos
  ) v
  where utc.user_id = p_user_id
    and utc.course_id = v.course_id;
end;
$$;

grant execute on function public.reorder_top_ten_courses(uuid, uuid[]) to authenticated;