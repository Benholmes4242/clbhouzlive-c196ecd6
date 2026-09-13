#!/usr/bin/env bash
# Phase D1 port-fidelity harness. Local throwaway cluster; touches nothing live.
set -euo pipefail
DIR=/tmp/exd1
export PGDATA=$DIR/pg PGHOST=$DIR/sock PGPORT=55432 PGUSER=postgres PGDATABASE=postgres
unset PGPASSWORD PGSSLMODE || true
rm -rf "$DIR"; mkdir -p "$PGDATA" "$PGHOST"
initdb -U postgres -A trust >/dev/null
pg_ctl -D "$PGDATA" -o "-k $PGHOST -p $PGPORT -c listen_addresses=''" -w start >/dev/null
trap 'pg_ctl -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true' EXIT

psql -v ON_ERROR_STOP=1 -q -c "create role anon; create role authenticated; create role service_role;"
psql -v ON_ERROR_STOP=1 -q -c "create table viewer_standing_fixture(viewer uuid, course_id uuid, rank_now int, field_now int, rank_then int, delta int);"
psql -v ON_ERROR_STOP=1 -q -f tests/sql/explore_stream_d1_fixture.sql
psql -v ON_ERROR_STOP=1 -q -f docs/sql/explore_stream_d1.sql
psql -v ON_ERROR_STOP=1 -f tests/sql/explore_stream_d1_assert.sql
