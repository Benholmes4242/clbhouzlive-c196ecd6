// COUNTER FLIP RE-ENQUEUE (BRIEF_EVALUATOR_HOLE_RACE ADDENDUM A §2).
//
// whs_scores.is_counter is England Golf's flag and is refreshed on EVERY sync
// upsert as the member's twenty-round window rolls. gam_round_stats.is_counter
// is a snapshot taken once at evaluation time and, because of the evaluator
// version guard, never re-read. A round that arrives as not-a-counter and later
// becomes one therefore keeps a stale false forever.
//
// This pair of helpers is called AROUND the score upsert (which is left exactly
// as it is — eg-api.ts is untouched): snapshot is_counter before, diff after,
// and put any round whose flag CHANGED back on gam_evaluation_queue. That is
// the same mechanism and the same table the hole-arrival re-enqueue uses.
//
// Safety on re-evaluation is the evaluator's existing evaluator_version_last
// guard (parent brief fix 5): a re-evaluated round rewrites gam_round_stats but
// does not re-apply streaks, badges, statuses or rivalries, so nothing is
// double-counted.

// deno-lint-ignore no-explicit-any
type Client = any;

/** whs_score_uid -> is_counter, as stored before the upsert. */
export async function snapshotCounterFlags(
  client: Client,
  connectionId: string,
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const { data, error } = await client
    .from("whs_scores")
    .select("whs_score_uid, is_counter")
    .eq("connection_id", connectionId);
  if (error) {
    console.warn("[counter-requeue] snapshot failed (non-fatal):", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (row.whs_score_uid == null) continue;
    map.set(String(row.whs_score_uid), row.is_counter === true);
  }
  return map;
}

/**
 * Re-enqueue every round of this connection whose is_counter differs from the
 * pre-upsert snapshot. Rounds absent from the snapshot are NEW and are enqueued
 * by the normal insert path, so they are ignored here. Non-fatal throughout.
 */
export async function requeueCounterFlips(
  client: Client,
  connectionId: string,
  userId: string,
  before: Map<string, boolean>,
): Promise<number> {
  try {
    const { data, error } = await client
      .from("whs_scores")
      .select("id, whs_score_uid, is_counter")
      .eq("connection_id", connectionId);
    if (error) throw error;

    const changedIds: string[] = [];
    for (const row of data ?? []) {
      if (row.whs_score_uid == null) continue;
      const prev = before.get(String(row.whs_score_uid));
      if (prev === undefined) continue; // new round, normal path owns it
      if (prev !== (row.is_counter === true)) changedIds.push(row.id);
    }
    if (changedIds.length === 0) return 0;

    console.log(
      JSON.stringify({
        evt: "whs_counter_flip_requeued",
        connection_id: connectionId,
        count: changedIds.length,
      }),
    );

    await client.from("gam_evaluation_queue").upsert(
      changedIds.map((id) => ({
        user_id: userId,
        whs_score_id: id,
        evaluator_version: 1,
        status: "queued",
        attempts: 0,
        error: null,
        processed_at: null,
        enqueued_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,whs_score_id,evaluator_version" },
    );
    return changedIds.length;
  } catch (e) {
    console.error("[counter-requeue] requeue failed (non-fatal):", e);
    return 0;
  }
}
