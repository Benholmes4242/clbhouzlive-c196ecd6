import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { LEGEND_NOTIFY_MAX_AGE_DAYS, playDateFreshness } from "./noticeFreshness.ts";

const NOW = new Date("2026-09-22T11:00:00Z");

Deno.test("a round played today is fresh — the notice fires", () => {
  const f = playDateFreshness("2026-09-22", NOW);
  assertEquals(f.fresh, true);
  assertEquals(f.ageDays, 0);
});

Deno.test("the same round re-evaluated a week later is stale — no notice", () => {
  const f = playDateFreshness("2026-09-22", new Date("2026-09-29T11:00:00Z"));
  assertEquals(f.fresh, false);
  assertEquals(f.reason, "stale");
  assertEquals(f.ageDays, 7);
});

Deno.test("a requeued 2022 round is stale — no notice", () => {
  const f = playDateFreshness("2022-06-11", NOW);
  assertEquals(f.fresh, false);
  assertEquals(f.reason, "stale");
});

Deno.test("no trigger round at all — no notice", () => {
  assertEquals(playDateFreshness(null, NOW).reason, "missing");
  assertEquals(playDateFreshness(undefined, NOW).reason, "missing");
  assertEquals(playDateFreshness("", NOW).reason, "missing");
});

Deno.test("an unparseable play_date is not a fresh one", () => {
  const f = playDateFreshness("not-a-date", NOW);
  assertEquals(f.fresh, false);
  assertEquals(f.reason, "unparseable");
});

Deno.test("the boundary is the existing constant, inclusive", () => {
  assertEquals(LEGEND_NOTIFY_MAX_AGE_DAYS, 2);
  assertEquals(playDateFreshness("2026-09-20", NOW).fresh, true); // 2 days
  assertEquals(playDateFreshness("2026-09-19", NOW).fresh, false); // 3 days
});

Deno.test("a timestamp play_date is read by its date part", () => {
  assertEquals(playDateFreshness("2026-09-21T22:30:00+00:00", NOW).fresh, true);
});
