// deno-lint-ignore-file no-explicit-any
import {
  decideRoute,
  modelDeclined,
  needsStaticExplainer,
} from "./router.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// --- routing table ------------------------------------------------------------

type Case = { q: string; exp: "live" | "static"; reason?: string };

const cases: Case[] = [
  // Default to live (Perplexity)
  { q: "How many hole-in-ones has Tiger Woods had?", exp: "live" },
  { q: "Who won last week's PGA Tour event?", exp: "live" },
  { q: "Best drivers this year", exp: "live" },
  { q: "Ryder Cup captain right now", exp: "live" },
  { q: "LPGA leaderboard today", exp: "live" },
  { q: "What are tee times for the Masters tomorrow?", exp: "live" },

  // Static explainers / historical
  { q: "Explain how golf handicap works", exp: "static" },
  { q: "How to read a green", exp: "static" },
  { q: "History of the Masters", exp: "static" },
  { q: "What happened in the 1997 Masters?", exp: "static" },
  { q: "Who won the U.S. Open in 2015?", exp: "static" }, // explicit past year ≤ 2022
];

Deno.test("needsStaticExplainer() basics", () => {
  const expl = needsStaticExplainer("Explain how golf handicap works");
  assertEquals(expl[0], true);

  const hist = needsStaticExplainer("Who won the 2010 Open Championship?");
  assertEquals(hist[0], true);

  const live = needsStaticExplainer("Who won last week's PGA event?");
  assertEquals(live[0], false);
});

Deno.test("decideRoute() inverted hybrid (Perplexity-first)", () => {
  for (const c of cases) {
    const d = decideRoute(c.q, "auto");
    assertEquals(
      d.route,
      c.exp,
      `Prompt misrouted:\nQ: ${c.q}\nGot: ${d.route}\nExpected: ${c.exp}\nReason: ${d.reason}`,
    );
  }
});

Deno.test("modelDeclined() triggers live fallback", () => {
  const samples = [
    "I don't have current information due to my knowledge cutoff.",
    "I can't browse the web, please check the web.",
    "Not up to date on live leaderboards.",
  ];
  for (const s of samples) {
    if (!modelDeclined(s)) {
      throw new Error(`Expected modelDeclined=true for: "${s}"`);
    }
  }
  if (modelDeclined("All good, here is the answer.")) {
    throw new Error("False positive on modelDeclined()");
  }
});

// Optional: forced mode
Deno.test("decideRoute() respects forced mode", () => {
  const forcedLive = decideRoute("Explain handicap", "live");
  assertEquals(forcedLive.route, "live");

  const forcedStatic = decideRoute("Leaderboard today", "static");
  assertEquals(forcedStatic.route, "static");
});
