# Post Sanity Checks

Diagnostic queries to detect posts without media (orphaned posts).

## 1. Find posts without media (non-achievement only)

Posts that have no `post_media` rows and are not achievement posts:

```sql
-- Posts (non-achievement) that have no post_media rows
select p.id,
       p.user_id,
       p.created_at,
       p.content
from posts p
left join post_media m on m.post_id = p.id
where m.id is null
  and p.achievement_id is null
order by p.created_at desc;
```

## 2. Count orphaned posts

Quick count of how many orphaned posts exist:

```sql
select count(*)
from posts p
left join post_media m on m.post_id = p.id
where m.id is null
  and p.achievement_id is null;
```

## 3. (Optional) Delete orphaned posts without media

⚠️ **Destructive operation** – Only use manually after careful review.

```sql
delete from posts
where id in (
  select p.id
  from posts p
  left join post_media m on m.post_id = p.id
  where m.id is null
    and p.achievement_id is null
);
```

## Notes

- Achievement posts (`achievement_id IS NOT NULL`) are allowed to exist without media.
- Use the dev UI panel (`PostSanityDevPanel`) to quickly check the count during development.
- The RPC function `count_orphan_posts()` is available for programmatic checks.
