// supabase/functions/clbhouz-pro-ai/router.ts

export type Route = "live" | "static";
export type Mode = "auto" | Route;

// Golf rules keywords
const GOLF_RULES_PATTERNS = /\b(rule|penalty|drop|relief|oob|out of bounds|hazard|lateral|stroke and distance|unplayable|lost ball|provisional|free relief|embedded ball|ground under repair|abnormal course condition|movable obstruction|immovable obstruction|wrong ball|wrong green|bunker|penalty area|teeing area|general area|putting green|nearest point|reference point|one club length|two club lengths|back on line|opposite margin)\b/i;

// Golf technique keywords  
const GOLF_TECHNIQUE_PATTERNS = /\b(grip|stance|swing|backswing|downswing|follow through|follow-through|takeaway|setup|alignment|posture|ball position|weight shift|hip rotation|shoulder turn|lag|release|impact position|address position|pre-shot routine|tempo|rhythm|golf swing|iron swing|driver swing|putting stroke|chipping technique|pitching|bunker shot|flop shot|punch shot|draw|fade|slice|hook|push|pull)\b/i;

// Golf equipment keywords
const GOLF_EQUIPMENT_PATTERNS = /\b(driver|iron|wedge|putter|hybrid|wood|fairway wood|shaft|loft|lie angle|bounce|grind|cavity back|blade|mallet|head|clubhead|grip size|flex|regular flex|stiff flex|graphite|steel shaft|forged|cast|offset|spin|launch angle|smash factor|ball speed|carry distance|total distance|fitting|club fitting|golf ball|compression|urethane|surlyn)\b/i;

// Golf scoring/format keywords
const GOLF_SCORING_PATTERNS = /\b(handicap calculation|course rating|slope rating|stableford|match play|stroke play|four ball|foursome|alternate shot|best ball|scramble|par|birdie|eagle|bogey|double bogey|albatross|hole in one|cut|made the cut|gross score|net score|differential|handicap index|playing handicap|course handicap)\b/i;

// Explainer patterns
const EXPLAINER_PATTERNS = /\b(explain|how does|how do|what is|what are|how to|background|origin|history of|definition of|meaning of|difference between|types of|basics of|fundamentals|beginner|learn|understand|tutorial)\b/i;

// Historical year patterns (1900-2023 routes to OpenAI, 2024+ routes to Perplexity)
const HISTORICAL_YEAR_PATTERN = /\b(19\d{2}|20(0\d|1\d|2[0-3]))\b/;
const RECENT_YEAR_PATTERN = /\b(202[4-9]|203\d)\b/;

// Live/current patterns that should always use Perplexity
const LIVE_PATTERNS = /\b(today|now|current|latest|live|this week|this month|this year|last week|last month|right now|breaking|recent news|who is the current|who are the current|rankings|leaderboard|standings|scores|results|weather|tee times|prices?|news|announcement)\b/i;

export function needsStaticExplainer(q: string): [boolean, string] {
  const p = q.toLowerCase();

  // PRIORITY 1: Live/current data always goes to Perplexity
  if (LIVE_PATTERNS.test(p)) {
    return [false, "live-keywords"];
  }

  // PRIORITY 2: Recent years (2024+) go to Perplexity
  if (RECENT_YEAR_PATTERN.test(p)) {
    return [false, "recent-year"];
  }

  // PRIORITY 3: Golf rules - static knowledge
  if (GOLF_RULES_PATTERNS.test(p)) {
    return [true, "golf-rules"];
  }

  // PRIORITY 4: Golf technique - static knowledge
  if (GOLF_TECHNIQUE_PATTERNS.test(p)) {
    return [true, "golf-technique"];
  }

  // PRIORITY 5: Golf equipment - static knowledge
  if (GOLF_EQUIPMENT_PATTERNS.test(p)) {
    return [true, "golf-equipment"];
  }

  // PRIORITY 6: Golf scoring/formats - static knowledge
  if (GOLF_SCORING_PATTERNS.test(p)) {
    return [true, "golf-scoring"];
  }

  // PRIORITY 7: Explainers / how-to / background
  if (EXPLAINER_PATTERNS.test(p)) {
    return [true, "explainer"];
  }

  // PRIORITY 8: Historical years (1900-2023)
  if (HISTORICAL_YEAR_PATTERN.test(p)) {
    return [true, "historical"];
  }

  // Default to live for ambiguous queries (Perplexity can search if needed)
  return [false, "default-live"];
}

// Safety check: if OpenAI replies with a cutoff/decline, trigger live fallback
export function modelDeclined(text?: string): boolean {
  if (!text) return false;
  const p = text.toLowerCase();
  return /\b(i (don'?t|do not) have (current|real-?time) info|knowledge cutoff|can'?t browse|check the web|not up to date|my training data|as of my (last|knowledge) update)\b/.test(
    p
  );
}

// The top-level router used when mode === "auto"
export function decideRoute(q: string, mode: Mode = "auto"): { route: Route; reason: string } {
  if (mode !== "auto") return { route: mode, reason: "forced" };
  const [useStatic, reason] = needsStaticExplainer(q);
  return { route: useStatic ? "static" : "live", reason };
}
