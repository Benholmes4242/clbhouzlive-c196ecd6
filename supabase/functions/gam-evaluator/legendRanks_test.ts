// BRIEF_LEGEND_JOINT_RANKS — proofs for joint ranks and the set-based crown path.
import { assignCompetitionRanks, crownSetDelta, valueKey } from "./legendRanks.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// The signature helper, copied verbatim from index.ts so the write-skip test
// exercises the same string it does.
function legendBoardSignature(rows: Array<{ user_id: string; rank: number; value: unknown }>): string {
  return rows.map((r) => `${r.user_id}:${r.rank}:${Number(r.value).toFixed(6)}`).join("|");
}

const ranksOf = (values: number[]) =>
  assignCompetitionRanks(values.map((value, i) => ({ user_id: `u${i}`, value }))).map((r) => r.rank);

Deno.test("[70, 70, 73] ranks 1, 1, 3 — never 1, 2, 3", () => {
  assertEquals(ranksOf([70, 70, 73]), [1, 1, 3]);
});

Deno.test("[70, 73, 73, 75] ranks 1, 2, 2, 4", () => {
  assertEquals(ranksOf([70, 73, 73, 75]), [1, 2, 2, 4]);
});

Deno.test("values differing only past the sixth decimal are a TIE", () => {
  const a = 41;
  const b = 41 + 1e-9;
  assertEquals(a === b, false, "the two values are not identical floats");
  assertEquals(valueKey(a), valueKey(b));
  assertEquals(ranksOf([a, b, 44]), [1, 1, 3]);
});

Deno.test("distinct values at the sixth decimal are NOT tied", () => {
  assertEquals(ranksOf([70, 70.000002, 73]), [1, 2, 3]);
});

Deno.test("a joiner earns; the existing rank-1 holder is told nothing", () => {
  const prev = [
    { user_id: "holder", rank: 1 },
    { user_id: "third", rank: 2 },
  ];
  const next = assignCompetitionRanks([
    { user_id: "holder", value: 86 },
    { user_id: "joiner", value: 86 },
    { user_id: "third", value: 90 },
  ]);
  assertEquals(next.map((r) => r.rank), [1, 1, 3]);
  const d = crownSetDelta(prev, next);
  assertEquals(d.earned, ["joiner"]);
  assertEquals(d.lost, []);
  assertEquals(d.retained, ["holder"]);
});

Deno.test("a member dropping out of the rank-1 set still receives legend_lost", () => {
  const prev = [{ user_id: "old", rank: 1 }, { user_id: "new", rank: 2 }];
  const next = assignCompetitionRanks([
    { user_id: "new", value: 80 },
    { user_id: "old", value: 86 },
  ]);
  const d = crownSetDelta(prev, next);
  assertEquals(d.earned, ["new"]);
  assertEquals(d.lost, ["old"]);
  assertEquals(d.retained, []);
});

Deno.test("both joint holders displaced: two losses, one gain", () => {
  const prev = [
    { user_id: "a", rank: 1 },
    { user_id: "b", rank: 1 },
  ];
  const next = assignCompetitionRanks([
    { user_id: "c", value: 79 },
    { user_id: "a", value: 86 },
    { user_id: "b", value: 86 },
  ]);
  assertEquals(next.map((r) => r.rank), [1, 2, 2]);
  const d = crownSetDelta(prev, next);
  assertEquals(d.earned, ["c"]);
  assertEquals(d.lost.sort(), ["a", "b"]);
});

Deno.test("write-skip still returns early when a board is genuinely unchanged", () => {
  const stored = [
    { user_id: "a", rank: 1, value: 70 },
    { user_id: "b", rank: 1, value: 70 },
    { user_id: "c", rank: 3, value: 73 },
  ];
  const ranked = assignCompetitionRanks([
    { user_id: "a", value: 70 },
    { user_id: "b", value: 70.0000000001 }, // float noise, same board
    { user_id: "c", value: 73 },
  ]);
  assertEquals(
    legendBoardSignature(stored),
    legendBoardSignature(ranked.map((r) => ({ user_id: r.user_id, rank: r.rank, value: r.value }))),
  );
  assertEquals(crownSetDelta(stored, ranked), { earned: [], lost: [], retained: ["a", "b"] });
});

Deno.test("an empty board produces no crown events", () => {
  assertEquals(crownSetDelta([], []), { earned: [], lost: [], retained: [] });
  assertEquals(crownSetDelta(null, undefined), { earned: [], lost: [], retained: [] });
});
