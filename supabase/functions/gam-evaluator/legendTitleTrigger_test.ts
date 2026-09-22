// BRIEF_LEGEND_TITLE_TRIGGER — wiring proof.
//
// The freshness GATE (noticeFreshness_test.ts) already proves: a play_date of
// today fires, a stale/missing/null play_date does not. What those tests cannot
// prove is that recomputeLegendTitles actually RECEIVES the triggering round's
// play_date. index.ts has module side effects (Supabase client construction), so
// these tests assert the wiring at source level: the trigger is threaded, and
// the no-trigger caller passes null.

import { assert, assertEquals } from "jsr:@std/assert";

const src = await Deno.readTextFile(new URL("./index.ts", import.meta.url));

Deno.test("recomputeLegendTitles accepts a triggerPlayDate parameter", () => {
  assert(
    /async function recomputeLegendTitles\(userId: string, triggerPlayDate: string \| null = null\)/.test(src),
    "recomputeLegendTitles must take triggerPlayDate",
  );
});

Deno.test("recomputeLegendTitles passes triggerPlayDate to upsertBadgeTiered", () => {
  const m = src.match(
    /async function recomputeLegendTitles[\s\S]*?upsertBadgeTiered\(userId, "legend_at_course", count, tier, null, (\w+)\)/,
  );
  assert(m, "upsertBadgeTiered call inside recomputeLegendTitles not found");
  assertEquals(m![1], "triggerPlayDate");
});

Deno.test("applyCourseLegends threads the existing LegendTrigger's play_date — both sides", () => {
  const calls = src.match(/recomputeLegendTitles\((lostUser|earnedUser), trigger\?\.play_date \?\? null\)/g) ?? [];
  assertEquals(calls.length, 2, "both crown-set recompute calls must thread trigger.play_date");
});

Deno.test("the recompute_legend_titles action passes null and stays silent", () => {
  assert(
    /if \(opts\.apply\) await recomputeLegendTitles\(userId, null\)/.test(src),
    "the one-off backfill must pass null",
  );
});
