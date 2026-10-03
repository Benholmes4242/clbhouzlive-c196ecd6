import { assertEquals } from "jsr:@std/assert@1";
import { resolveAwards, type BestsRow, type UnitCandidate } from "./awards.ts";

const prior = (kind: string, p: Partial<BestsRow>): BestsRow => ({
  user_id: "u", golf_course_id: "c", unit_kind: kind, unit_key: kind === "hole" ? 7 : 0,
  attempts: 12, best_value: 0, second_value: 0, third_value: 1, tenth_value: 2,
  best_score_id: null, best_attained_at: null, birdied: false, first_birdie_at: null, ...p,
});
const hole = (v: number): UnitCandidate => ({ unit_kind: "hole", unit_key: 7, value: v, lowerBetter: true, holeToPar: v });
const kinds = (a: { award_kind: string; tier: string }[]) => a.map((x) => `${x.award_kind}:${x.tier}`);

Deno.test("hole matching prior best yields no award", () => {
  assertEquals(kinds(resolveAwards(hole(0), prior("hole", { birdied: true }))), []);
});
Deno.test("hole inside top three / top ten yields no award", () => {
  assertEquals(kinds(resolveAwards(hole(0), prior("hole", { best_value: -1, birdied: true }))), []);
  assertEquals(kinds(resolveAwards(hole(1), prior("hole", { best_value: -1, third_value: 2, tenth_value: 3, birdied: true }))), []);
});
Deno.test("hole beating prior best still yields gold", () => {
  assertEquals(kinds(resolveAwards(hole(-1), prior("hole", { birdied: true }))), ["new_best:gold"]);
});
Deno.test("first birdie on a hole still yields bronze", () => {
  assertEquals(kinds(resolveAwards(hole(-1), prior("hole", { best_value: -1, birdied: false }))), ["first_birdie:bronze"]);
  assertEquals(kinds(resolveAwards(hole(-1), null)), ["first_birdie:bronze"]);
});
Deno.test("coarse unit matching prior best still yields silver", () => {
  const u: UnitCandidate = { unit_kind: "front_nine", unit_key: 0, value: 0, lowerBetter: true, holeToPar: null };
  assertEquals(kinds(resolveAwards(u, prior("front_nine", {}))), ["matched_best:silver"]);
});
Deno.test("coarse placings unchanged", () => {
  const u = (v: number): UnitCandidate => ({ unit_kind: "round_gross", unit_key: 0, value: v, lowerBetter: true, holeToPar: null });
  const p = prior("round_gross", { best_value: 70, second_value: 72, third_value: 74, tenth_value: 80 });
  assertEquals(kinds(resolveAwards(u(69), p)), ["new_best:gold"]);
  assertEquals(kinds(resolveAwards(u(73), p)), ["top_three:silver"]);
  assertEquals(kinds(resolveAwards(u(78), p)), ["top_ten:bronze"]);
});
