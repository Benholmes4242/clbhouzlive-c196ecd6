/**
 * THE EXPLORE SERVER-STREAM SWITCH.
 *
 * `get_explore_stream` is correct but, until the shape fix in
 * docs/sql/explore_stream_field_join.sql is deployed and re-measured, it costs
 * ~28s under RLS and every /amateur load pays the authenticated 8-second
 * statement timeout (57014) before the accepted client composition catches it.
 *
 * So the page does not ATTEMPT the RPC. This is a switch, not a deletion: the
 * server path, its error reporting, its fallback telemetry and its query keys
 * are all still wired. To bring the server ranker back, set this to `true` —
 * that is the whole change.
 *
 * DO NOT flip this on in the same change as a SQL fix. It goes back on only
 * once both EXPLAIN runs (as postgres and as authenticated) are comfortably
 * inside the 8-second authenticated timeout.
 */
/**
 * ON. The shape fix (docs/sql/explore_stream_field_join.sql) is deployed and
 * measured: 283 ms as postgres, 804 ms as authenticated, 140,706 buffer hits —
 * comfortably inside the 8-second authenticated timeout with ~10x headroom.
 * The RLS multiple is now 2.8x (was 4x); the policies are still expensive per
 * row, but the row count they run against has collapsed. Filed, not chased.
 */
export const EXPLORE_SERVER_STREAM_ENABLED = true;
