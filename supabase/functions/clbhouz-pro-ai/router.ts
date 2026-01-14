// supabase/functions/clbhouz-pro-ai/router.ts

export type Route = "live" | "static";
export type Mode = "auto" | Route;

// Golf-specific static knowledge patterns
const GOLF_RULES_KEYWORDS = [
  "rule", "penalty", "drop", "relief", "oob", "out of bounds", "hazard", 
  "stroke and distance", "unplayable", "lateral", "water hazard", "bunker rule",
  "loose impediment", "ground under repair", "embedded ball", "lost ball",
  "provisional", "nearest point", "one club length", "two club length"
];

const GOLF_TECHNIQUE_KEYWORDS = [
  "grip", "stance", "swing", "backswing", "downswing", "follow through", 
  "setup", "alignment", "takeaway", "impact position", "tempo", "rhythm",
  "weight shift", "hip turn", "shoulder turn", "lag", "release", "plane",
  "draw", "fade", "slice fix", "hook fix", "ball position", "posture"
];

const GOLF_EQUIPMENT_KEYWORDS = [
  "driver loft", "iron loft", "wedge", "putter", "shaft", "loft", "lie angle",
  "club fitting", "shaft flex", "swing weight", "grip size", "ball flight",
  "spin rate", "launch angle", "smash factor", "carry distance", "offset",
  "cavity back", "blade", "forged", "game improvement"
];

const GOLF_KNOWLEDGE_KEYWORDS = [
  "handicap calculation", "handicap index", "course rating", "slope rating",
  "stableford", "match play", "stroke play", "four ball", "foursome", 
  "alternate shot", "scramble", "best ball", "net score", "gross score",
  "equitable stroke control", "playing handicap", "course handicap"
];

// Build combined static pattern regex
const staticKeywordPattern = [
  ...GOLF_RULES_KEYWORDS,
  ...GOLF_TECHNIQUE_KEYWORDS,
  ...GOLF_EQUIPMENT_KEYWORDS,
  ...GOLF_KNOWLEDGE_KEYWORDS
].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

export function needsStaticExplainer(q: string): [boolean, string] {
  const p = q.toLowerCase();

  // Explainers / how-to / background (general knowledge questions)
  if (/(explain|how does|how do|what is|what are|how to|background|origin|history of|difference between|why do|why does|meaning of|definition of)/i.test(p)) {
    // But if asking about current/2024+ events, route to live
    if (/(2024|2025|2026|current|today|now|latest|this year|right now)/i.test(p)) {
      return [false, "current-event-explainer"];
    }
    return [true, "explainer"];
  }

  // Golf-specific static knowledge (rules, technique, equipment, scoring)
  const golfStaticRegex = new RegExp(`(${staticKeywordPattern})`, 'i');
  if (golfStaticRegex.test(p)) {
    // Unless asking about current prices/availability or 2024+ changes
    if (/(price|cost|buy|purchase|available|stock|2024|2025|current)/i.test(p)) {
      return [false, "golf-current-info"];
    }
    return [true, "golf-static"];
  }

  // Explicitly historical years (1900–2023) - OpenAI has knowledge cutoff of early 2024
  if (/\b(19\d{2}|20(0\d|1\d|2[0-3]))\b/.test(p)) {
    // But if also mentioning 2024+, route to live for comparison
    if (/\b(2024|2025|2026)\b/.test(p)) {
      return [false, "mixed-years"];
    }
    return [true, "historical"];
  }

  // General knowledge/educational questions without time-sensitive context
  if (/(teach me|learn|understand|basics of|fundamentals|beginner|introduction to)/i.test(p)) {
    return [true, "educational"];
  }

  // Default to live for everything else (real-time data, current events)
  return [false, "default-live"];
}

// Safety check: if OpenAI replies with a cutoff/decline, trigger live fallback
export function modelDeclined(text?: string): boolean {
  if (!text) return false;
  const p = text.toLowerCase();
  return /\b(i (don'?t|do not) have (current|real-?time) info|knowledge cutoff|can'?t browse|check the web|not up to date|as of my (knowledge|training))\b/.test(
    p
  );
}

// The top-level router used when mode === "auto"
export function decideRoute(q: string, mode: Mode = "auto"): { route: Route; reason: string } {
  if (mode !== "auto") return { route: mode, reason: "forced" };
  const [useStatic, reason] = needsStaticExplainer(q);
  return { route: useStatic ? "static" : "live", reason };
}
