-- Extra local shapes the D3 branches read. Additive to
-- tests/sql/explore_stream_d1_fixture.sql; NOT production SQL.
--
-- FULL PRODUCTION COLUMN SETS, guarded by tests/sql/schema_parity_assert.sql
-- against tests/sql/production_columns.snapshot.sql. See the D1 fixture header
-- for why a fixture that is merely "enough columns" is worthless.
create table top100_lists (
  id uuid primary key,
  slug text,
  name text,
  short_label text,
  description text,
  is_active boolean,
  sort_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now());

create table course_top100_memberships (
  id uuid primary key default gen_random_uuid(),
  course_id uuid,
  list_id uuid,
  rank int,
  added_at timestamptz default now(),
  updated_at timestamptz default now());
