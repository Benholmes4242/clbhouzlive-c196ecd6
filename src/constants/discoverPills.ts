export type MainPill =
  | "watch"
  | "loop"
  | "courses"
  | "videos"      // Back-compat alias
  | "explore"     // Back-compat alias
  | "channels"    // Back-compat alias
  | "following"   // Back-compat alias
  | "verified-pros"
  | "hack-shack";

// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Videos": "watch",
  "Channels": "courses",
  "Following": "loop",
  "Friends": "loop",
  "Verified Pros": "verified-pros",
  "Hack Shack": "hack-shack",
};
