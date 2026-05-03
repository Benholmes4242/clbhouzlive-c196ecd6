insert into whs_handicap_snapshots (connection_id, observed_at, handicap_index)
select distinct on (s.connection_id, s.play_date)
  s.connection_id,
  (s.play_date::timestamp + interval '12 hours') at time zone 'UTC' as observed_at,
  s.handicap_index_at_time as handicap_index
from whs_scores s
where s.handicap_index_at_time is not null
  and not exists (
    select 1 from whs_handicap_snapshots existing
    where existing.connection_id = s.connection_id
      and date(existing.observed_at) = s.play_date
  )
order by s.connection_id, s.play_date, s.created_at desc;