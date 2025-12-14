/**
 * Achievement Ring Tokens - Single Source of Truth
 * 
 * Maps achievement tiers to ring colors (bgDark + accent).
 * Used by SquircleAvatar for data-driven glow rings.
 */

export type AchievementRingTier =
  | "NONE"
  | "FAIR"
  | "MILD"
  | "STEADY"
  | "RESPECTABLE"
  | "GOOD"
  | "VERY_GOOD"
  | "EXCELLENT"
  | "OUTSTANDING";

export interface RingToken {
  bgDark: string;
  accent: string;
}

export const RING_TOKENS: Record<AchievementRingTier, RingToken> = {
  NONE: { bgDark: "#D1D5DB", accent: "#D1D5DB" },

  // 5 Club
  FAIR: { bgDark: "#6C5D4D", accent: "#7A6B5B" },
  // 10 Club
  MILD: { bgDark: "#817861", accent: "#8F866F" },
  // 20 Club
  STEADY: { bgDark: "#999B7C", accent: "#A7A98A" },
  // 50 Club
  RESPECTABLE: { bgDark: "#B3C193", accent: "#C1CFA1" },
  // 100 Club
  GOOD: { bgDark: "#7AA86D", accent: "#88B67B" },
  // 200 Club
  VERY_GOOD: { bgDark: "#4D9047", accent: "#5B9E55" },
  // 300 Club
  EXCELLENT: { bgDark: "#317133", accent: "#3F7F41" },
  // 400 Club (gold)
  OUTSTANDING: { bgDark: "#C4A653", accent: "#D2B461" },
};

/**
 * Get achievement ring tier from Top 100 courses played count
 */
export function getTierFromTop100Count(count: number): AchievementRingTier {
  if (count >= 400) return "OUTSTANDING";
  if (count >= 300) return "EXCELLENT";
  if (count >= 200) return "VERY_GOOD";
  if (count >= 100) return "GOOD";
  if (count >= 50) return "RESPECTABLE";
  if (count >= 20) return "STEADY";
  if (count >= 10) return "MILD";
  if (count >= 5) return "FAIR";
  return "NONE";
}

/**
 * Get ring token colors for a Top 100 count
 */
export function getRingTokenForCount(count: number): RingToken {
  const tier = getTierFromTop100Count(count);
  return RING_TOKENS[tier];
}

/**
 * Convert hex color to rgba with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color by a percentage (0-100)
 */
export function lightenHex(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const lighten = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * (percent / 100)));
  
  const rNew = lighten(r).toString(16).padStart(2, '0');
  const gNew = lighten(g).toString(16).padStart(2, '0');
  const bNew = lighten(b).toString(16).padStart(2, '0');
  
  return `#${rNew}${gNew}${bNew}`;
}
