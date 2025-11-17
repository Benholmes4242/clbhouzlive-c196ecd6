-- Create RPC function to count orphaned posts (posts without media, non-achievement only)
create or replace function count_orphan_posts()
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from posts p
  left join post_media m on m.post_id = p.id
  where m.id is null
    and p.achievement_id is null;
$$;