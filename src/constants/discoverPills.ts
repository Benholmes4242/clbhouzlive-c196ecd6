export type MainPill =
  | "shorts"
  | "channels"
  | "videos"
  | "following"
  | "verified-pros"
  | "hack-shack";


// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Shorts": "shorts",
  "Channels": "channels",
  "Videos": "videos",
  "Following": "following",
  "Friends": "following", // Back-compat alias
  "Verified Pros": "verified-pros",
  "Hack Shack": "hack-shack",
};