// BRIEF_CONTESTED_TITLES proofs.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { boardKey, contestedBoardKeys, countContestedTitles } from "./legendTitles.ts";

const row = (course_id: string, category: string) => ({ course_id, category });

Deno.test("rank 1 on a board with ONE claimant gains no title", () => {
  const mine = [row("c1", "lowest_gross_all_time")];
  const claimants = [row("c1", "lowest_gross_all_time")]; // only them
  assertEquals(countContestedTitles(mine, claimants), 0);
});

Deno.test("JOINT rank 1 on a board of three gains a title", () => {
  const mine = [row("c1", "lowest_gross_all_time")];
  const claimants = [
    row("c1", "lowest_gross_all_time"), // joint first (them)
    row("c1", "lowest_gross_all_time"), // joint first (other)
    row("c1", "lowest_gross_all_time"), // third
  ];
  assertEquals(countContestedTitles(mine, claimants), 1);
});

Deno.test("exactly two claimants is contested — > 1, no larger floor", () => {
  const mine = [row("c1", "most_birdies_all_time")];
  const claimants = [row("c1", "most_birdies_all_time"), row("c1", "most_birdies_all_time")];
  assertEquals(countContestedTitles(mine, claimants), 1);
});

Deno.test("only the contested boards count, per (course, category)", () => {
  const mine = [
    row("c1", "lowest_gross_all_time"), // contested
    row("c1", "most_aces_all_time"),    // solo board on the same course
    row("c2", "lowest_gross_all_time"), // contested
    row("c3", "most_eagles_all_time"),  // solo
  ];
  const claimants = [
    row("c1", "lowest_gross_all_time"), row("c1", "lowest_gross_all_time"),
    row("c1", "most_aces_all_time"),
    row("c2", "lowest_gross_all_time"), row("c2", "lowest_gross_all_time"), row("c2", "lowest_gross_all_time"),
    row("c3", "most_eagles_all_time"),
  ];
  assertEquals(countContestedTitles(mine, claimants), 2);
});

Deno.test("categories on the same course are separate boards", () => {
  assertEquals(boardKey(row("c1", "a")) === boardKey(row("c1", "b")), false);
  const contested = contestedBoardKeys([
    row("c1", "a"), row("c1", "b"), // one claimant each — NOT contested
  ]);
  assertEquals(contested.size, 0);
});

Deno.test("a duplicated rank-1 row cannot inflate the count", () => {
  const mine = [row("c1", "a"), row("c1", "a")];
  const claimants = [row("c1", "a"), row("c1", "a")];
  assertEquals(countContestedTitles(mine, claimants), 1);
});

Deno.test("a member with no rank-1 rows counts zero", () => {
  assertEquals(countContestedTitles([], [row("c1", "a"), row("c1", "a")]), 0);
});
