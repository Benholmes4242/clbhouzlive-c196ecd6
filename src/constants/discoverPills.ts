export type MainPill =
  | "friends"
  | "videos" 
  | "photos"
  | "trending"
  | "verified-pros"
  | "channels"
  | "hack-shack";


// Map filter types to main pills
export const FILTER_TO_MAIN_PILL: Record<string, MainPill> = {
  "Friends": "friends",
  "Videos": "videos",
  "Photos": "photos", 
  "Trending": "trending",
  "Verified Pros": "verified-pros",
  "Channels": "channels",
  "Hack Shack": "hack-shack",
};