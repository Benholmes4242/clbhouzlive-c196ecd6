#!/usr/bin/env bash
# Phase D3 harness: the remaining views. Local throwaway cluster; nothing live.
set -euo pipefail
DIR=${EXD3_DIR:-/tmp/exd3pg}   # throwaway cluster dir; must NOT hold the repo
export PGDATA=$DIR/pg PGHOST=$DIR/sock PGPORT=55434 PGUSER=postgres PGDATABASE=postgres
unset PGPASSWORD PGSSLMODE || true
rm -rf "$DIR"; mkdir -p "$PGDATA" "$PGHOST"
initdb -U postgres -A trust >/dev/null
pg_ctl -D "$PGDATA" -o "-k $PGHOST -p $PGPORT -c listen_addresses=''" -w start >/dev/null
trap 'pg_ctl -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true' EXIT

psql -v ON_ERROR_STOP=1 -q -c "create role anon; create role authenticated; create role service_role;"
psql -v ON_ERROR_STOP=1 -q -c "create table viewer_standing_fixture(viewer uuid, course_id uuid, rank_now int, field_now int, rank_then int, delta int);"
psql -v ON_ERROR_STOP=1 -q -f tests/sql/explore_stream_d1_fixture.sql
psql -v ON_ERROR_STOP=1 -q -f tests/sql/explore_stream_d3_fixture.sql
# SCHEMA PARITY FIRST (audit ruling 3). A harness on a schema production does not
# have proves nothing, so this runs before any function body is loaded.
psql -v ON_ERROR_STOP=1 -q -f tests/sql/production_columns.snapshot.sql
psql -v ON_ERROR_STOP=1 -f tests/sql/schema_parity_assert.sql
psql -v ON_ERROR_STOP=1 -q -f docs/sql/explore_stream_d1.sql   # config table + D1 body
psql -v ON_ERROR_STOP=1 -q -f docs/sql/explore_stream_d2.sql   # D2 body (deployed)
psql -v ON_ERROR_STOP=1 -q -f docs/sql/explore_stream_d3.sql   # D3 replaces the body
psql -v ON_ERROR_STOP=1 -f tests/sql/explore_stream_d3_assert.sql
