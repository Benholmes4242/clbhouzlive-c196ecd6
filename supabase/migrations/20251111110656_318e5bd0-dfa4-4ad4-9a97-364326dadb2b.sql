-- Fix echo_history_search to compute preview_snippet on the fly
-- removed non-existent mode column reference
create or replace function public.echo_history_search(
  q text default null,
  filter_has_response boolean default null,
  date_from timestamptz default null,
  date_to timestamptz default null,
  mode text default null,
  filter_starred boolean default null,
  filter_tag text default null,
  sort_mode text default 'default',
  max_results int default 100
)
returns table (
  thread_id uuid,
  first_user_question text,
  preview_snippet text,
  has_response boolean,
  is_starred boolean,
  last_activity_at timestamptz,
  message_count int,
  relative_date text,
  tags text[]
)
language sql
security definer
set search_path = public
as $$
  with thread_tags as (
    select
      tt.thread_id,
      array_agg(t.name) as tag_names
    from echo_thread_tags tt
    join echo_tags t on t.id = tt.tag_id
    group by tt.thread_id
  )
  select
    et.id as thread_id,
    et.first_user_question,
    -- compute preview snippet from the first assistant message
    (
      select left(em2.content, 220)
      from echo_messages em2
      where em2.thread_id = et.id and (em2.role = 'assistant' or em2.role = 'model')
      order by em2.created_at asc
      limit 1
    ) as preview_snippet,
    coalesce(et.has_response, false) as has_response,
    coalesce(et.is_starred, false) as is_starred,
    coalesce(et.last_activity_at, et.created_at) as last_activity_at,
    coalesce(et.message_count, 0) as message_count,
    null::text as relative_date,
    coalesce(tt.tag_names, array[]::text[]) as tags
  from echo_threads et
  left join thread_tags tt on tt.thread_id = et.id
  where
    et.user_id = auth.uid()
    and (q is null
      or exists (
        select 1 from echo_messages emq
        where emq.thread_id = et.id
          and lower(emq.content) like '%' || lower(q) || '%'
      )
    )
    and (filter_has_response is null or filter_has_response = coalesce(et.has_response, false))
    and (date_from is null or et.created_at >= date_from)
    and (date_to is null or et.created_at < date_to)
    and (filter_starred is null or filter_starred = coalesce(et.is_starred, false))
    and (
      filter_tag is null or exists (
        select 1
        from echo_thread_tags tt2
        join echo_tags t2 on t2.id = tt2.tag_id
        where tt2.thread_id = et.id and lower(t2.name) = lower(filter_tag)
      )
    )
  order by
    case when sort_mode = 'starred' then (case when coalesce(et.is_starred, false) then 0 else 1 end) else 0 end,
    coalesce(et.last_activity_at, et.created_at) desc
  limit coalesce(max_results, 100);
$$;

grant execute on function public.echo_history_search(
  text, boolean, timestamptz, timestamptz, text, boolean, text, text, int
) to authenticated;