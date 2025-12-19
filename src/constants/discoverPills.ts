export type MainPill =
  | "shorts"
  | "videos"
  | "channels"
  | "following"
  | "verified-pros"
  | "hack-shack"
  // Phase 1 new tabs
  | "watch"
  | "learn"
  | "explore";

// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Videos": "videos",
  "Channels": "channels",
  "Following": "following",
  "Friends": "following", // Back-compat alias
  "Verified Pros": "verified-pros",
  "Hack Shack": "hack-shack",
};