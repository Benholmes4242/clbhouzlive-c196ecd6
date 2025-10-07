export type MainPill =
  | "shorts"
  | "channels"
  | "videos"
  | "photos"
  | "friends"
  | "verified-pros"
  | "hack-shack";


// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Shorts": "shorts",
  "Channels": "channels",
  "Videos": "videos",
  "Photos": "photos",
  "Friends": "friends",
  "Verified Pros": "verified-pros",
  "Hack Shack": "hack-shack",
};