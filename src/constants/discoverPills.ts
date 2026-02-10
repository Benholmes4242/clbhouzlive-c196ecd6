export type MainPill =
  | "shorts"
  | "videos"
  | "explore"
  | "channels" // Back-compat alias
  | "following"
  | "verified-pros"
  | "hack-shack";

// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Videos": "videos",
  "Channels": "explore",
  "Following": "following",
  "Friends": "following", // Back-compat alias
  "Verified Pros": "verified-pros",
  "Hack Shack": "hack-shack",
};