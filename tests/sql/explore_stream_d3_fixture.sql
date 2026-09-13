-- Extra local shapes the D3 branches read. Additive to
-- tests/sql/explore_stream_d1_fixture.sql; NOT production SQL.
create table top100_lists (id uuid primary key, slug text);
create table course_top100_memberships (course_id uuid, list_id uuid, rank int);
