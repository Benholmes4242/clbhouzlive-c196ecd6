/**
 * Splits a formatted stat value into integer + decimal-tail parts.
 * The decimal tail renders in amber per the Stat Watch exemplar (IMG_6047).
 * Used by LeadersMasthead, CollegeMasthead, FranchiseCard.
 *
 * Test cases:
 *   "326.9 yds"   → { integer: "326", decimal: ".9", suffix: " yds" }
 *   "686.18"      → { integer: "686", decimal: ".18", suffix: "" }
 *   "$16.5M"      → { integer: "$16", decimal: ".5", suffix: "M" }
 *   "$5.2M"       → { integer: "$5", decimal: ".2", suffix: "M" }
 *   "$750K"       → { integer: "$750", decimal: "",   suffix: "K" }
 *   "$1.1M"       → { integer: "$1",  decimal: ".1", suffix: "M" }
 *   "73"          → { integer: "73",  decimal: "",   suffix: "" }
 *   "-1.4"        → { integer: "-1",  decimal: ".4", suffix: "" }
 */
export function splitStatValue(formatted: string): {
  integer: string;
  decimal: string;
  suffix: string;
} {
  const match = formatted.match(/^([^\d-]*-?\d+)(\.\d+)?(.*)$/);
  if (!match) return { integer: formatted, decimal: '', suffix: '' };
  return { integer: match[1], decimal: match[2] ?? '', suffix: match[3] ?? '' };
}
