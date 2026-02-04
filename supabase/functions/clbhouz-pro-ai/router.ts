// supabase/functions/clbhouz-pro-ai/router.ts

export type Route = "live" | "static";
export type Mode = "auto" | Route;

// Golf rules keywords - route to static (OpenAI has comprehensive rules knowledge)
const GOLF_RULES_PATTERNS = [
  /\b(rule|rules of golf|penalty|drop|relief|oob|out of bounds|hazard|lateral hazard|water hazard)/i,
  /\b(stroke and distance|unplayable|lost ball|provisional|embedded ball|ground under repair)/i,
  /\b(free relief|penalty area|bunker rule|putting green rule|teeing area)/i,
  /\b(nearest point|complete relief|one club length|two club lengths)/i,
];

// Golf technique keywords - route to static
const GOLF_TECHNIQUE_PATTERNS = [
  /\b(grip|stance|swing|backswing|downswing|follow.?through|setup|alignment|address|posture)/i,
  /\b(takeaway|transition|impact position|release|rotation|weight transfer|hip turn|shoulder turn)/i,
  /\b(draw|fade|hook|slice|shank|top|thin|fat|chunk|duff|skull)/i,
  /\b(ball position|club path|face angle|attack angle|swing plane|tempo|rhythm)/i,
  /\b(chipping|pitching|putting stroke|bunker shot|flop shot|punch shot|knockdown)/i,
];

// Golf equipment keywords - route to static
const GOLF_EQUIPMENT_PATTERNS = [
  /\b(driver|iron|wedge|putter|hybrid|fairway wood|wood|loft|lie angle|shaft|flex)/i,
  /\b(graphite|steel shaft|regular flex|stiff flex|x.?stiff|senior flex)/i,
  /\b(club fitting|launch angle|spin rate|smash factor|ball speed|carry distance)/i,
  /\b(golf ball|titleist|callaway|taylormade|ping|cobra|mizuno|cleveland|vokey)/i,
];

// Golf scoring/format knowledge - route to static
const GOLF_SCORING_PATTERNS = [
  /\b(handicap calculation|course rating|slope rating|playing handicap|handicap index)/i,
  /\b(stableford|match play|stroke play|fourball|foursomes|alternate shot|scramble|best ball)/i,
  /\b(birdie|eagle|albatross|bogey|double bogey|triple bogey|par|gross score|net score)/i,
  /\b(medal play|skins game|nassau|wolf|bingo bango bongo)/i,
];

// Historical/explainer patterns - route to static
const EXPLAINER_PATTERNS = [
  /\b(explain|how does|how do|what is|what are|how to|background|origin|history of)/i,
  /\b(why do|why does|why is|why are|definition of|meaning of|difference between)/i,
  /\b(basics of|fundamentals of|principles of|concept of|theory of)/i,
];

// Course history/design - route to static (unless asking about current conditions)
const COURSE_HISTORY_PATTERNS = [
  /\b(course design|course architect|designed by|built in|renovated|original layout)/i,
  /\b(signature hole|famous hole|history of .+(course|club|links))/i,
  /\b(alister mackenzie|donald ross|pete dye|tom fazio|jack nicklaus design|robert trent jones)/i,
];

// Player career history (before 2024) - route to static
const PLAYER_HISTORY_PATTERNS = [
  /\b(career|major wins|all.?time|career earnings|hall of fame|legacy|retired)/i,
  /\b(tiger woods|jack nicklaus|arnold palmer|gary player|ben hogan|bobby jones|seve ballesteros)/i,
];

// Current/live data patterns - route to Perplexity
const LIVE_DATA_PATTERNS = [
  /\b(today|tonight|tomorrow|yesterday|this week|this month|this year|right now|currently)/i,
  /\b(latest|live|current|now|up.?to.?date|as of|recent|breaking|just|new)/i,
  /\b(202[4-9]|203[0-9])/i, // Recent/future years need live data
  /\b(last week|last month|past week|past month)/i,
  /\b(next|upcoming|soon|scheduled|when is|when are|when does|next year)/i, // Time-sensitive queries
];

// Volatile entities that change frequently - route to Perplexity
const VOLATILE_PATTERNS = [
  // Golf majors & major events - CRITICAL for current schedule info
  /\b(major|majors|masters|us open|u\.s\. open|british open|the open|open championship|pga championship)/i,
  /\b(ryder cup|presidents cup|solheim cup|walker cup)/i,
  
  // Tours & rankings
  /\b(pga tour|european tour|dp world tour|liv golf|owgr|world ranking|rolex ranking)/i,
  
  // Results, standings & leaderboards
  /\b(leaderboard|rankings|scores|results|standings)/i,
  /\b(winner|won|winning|defending champion|current champion|reigning)/i,
  
  // Tee times & tournament info
  /\b(tee times|pairings|draw|field|cut line|made cut|missed cut)/i,
  
  // Personnel & status
  /\b(captain|manager|coach|lineup|fixture|schedule)/i,
  /\b(injured|injury|withdrew|withdrawal|playing in|entered|committed)/i,
  
  // Conditions & logistics
  /\b(weather|forecast|conditions|wind|rain|temperature)/i,
  /\b(course conditions|weather at|forecast for)/i,
  /\b(price|cost|green fee|membership fee|how much)/i,
  
  // News & updates
  /\b(news|announcement|transfer|signing|statement|confirmed|reportedly)/i,
  /\b(odds|betting|favorites|prediction|picks)/i,
  
  // Explicit current info requests
  /\b(who is the current|who won|winner of)/i,
];

// Check if query mentions explicitly historical years (1900-2023)
function mentionsHistoricalYear(text: string): boolean {
  const yearRegex = /\b(19\d{2}|20(0\d|1\d|2[0-3]))\b/g;
  const matches = text.match(yearRegex);
  return matches !== null && matches.length > 0;
}

// Check if query mentions recent years (2024+)
function mentionsRecentYear(text: string): boolean {
  const yearRegex = /\b(202[4-9]|20[3-9]\d)\b/g;
  return yearRegex.test(text);
}

export function needsStaticExplainer(q: string): [boolean, string] {
  const p = q.toLowerCase();

  // First check for live data patterns (high priority)
  if (LIVE_DATA_PATTERNS.some(pattern => pattern.test(p))) {
    // Exception: if it's explicitly historical even with "current" language
    if (mentionsHistoricalYear(p) && !mentionsRecentYear(p)) {
      return [true, "historical-year"];
    }
    return [false, "live-data-keywords"];
  }

  // Check volatile patterns (need fresh data)
  if (VOLATILE_PATTERNS.some(pattern => pattern.test(p))) {
    // Exception: historical context
    if (mentionsHistoricalYear(p) && !mentionsRecentYear(p)) {
      return [true, "historical-volatile"];
    }
    return [false, "volatile-entity"];
  }

  // Golf rules - always static
  if (GOLF_RULES_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "golf-rules"];
  }

  // Golf technique - always static
  if (GOLF_TECHNIQUE_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "golf-technique"];
  }

  // Golf equipment - always static
  if (GOLF_EQUIPMENT_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "golf-equipment"];
  }

  // Golf scoring/formats - always static
  if (GOLF_SCORING_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "golf-scoring"];
  }

  // Explainer questions - static
  if (EXPLAINER_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "explainer"];
  }

  // Course history/design - static
  if (COURSE_HISTORY_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "course-history"];
  }

  // Player career history - static
  if (PLAYER_HISTORY_PATTERNS.some(pattern => pattern.test(p))) {
    return [true, "player-history"];
  }

  // Explicitly historical years (1900-2023)
  if (mentionsHistoricalYear(p) && !mentionsRecentYear(p)) {
    return [true, "historical-year"];
  }

  // Default to live for ambiguous queries (safer for freshness)
  return [false, "default-live"];
}

// Safety check: if OpenAI replies with a cutoff/decline, trigger live fallback
export function modelDeclined(text?: string): boolean {
  if (!text) return false;
  const p = text.toLowerCase();
  return /\b(i (don'?t|do not) have (current|real-?time) info|knowledge cutoff|can'?t browse|check the web|not up to date|my training data|as of my last update|i cannot access|unable to provide current)\b/.test(
    p
  );
}

// The top-level router used when mode === "auto"
export function decideRoute(q: string, mode: Mode = "auto"): { route: Route; reason: string } {
  if (mode !== "auto") return { route: mode, reason: "forced" };
  const [useStatic, reason] = needsStaticExplainer(q);
  return { route: useStatic ? "static" : "live", reason };
}
