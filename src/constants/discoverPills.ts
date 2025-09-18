export type MainPill =
  | "friends"
  | "videos" 
  | "photos"
  | "trending"
  | "verified-pros"
  | "channels"
  | "hack-shack";

export const SUBPILLS: Record<MainPill, string[]> = {
  friends: ["Videos", "Photos", "Shorts"],
  videos: [
    "Videos",       // default first
    "Trending",
    "Shorts",
    "Chipping",
    "Driver Videos",
    "Hitting Bombs",
    "Golf Humour",
    "Hole in One",
    "Golf Swing",
  ],
  photos: ["Videos", "Trending", "Photos", "Shorts"],
  trending: ["Videos", "Photos", "Shorts"],
  "verified-pros": ["Videos", "Tips", "Lessons", "Highlights"],
  channels: ["Videos", "Series", "Clips"],
  "hack-shack": ["Videos", "Gear", "Drills", "DIY"],
};

export const DEFAULT_SUBPILL = "Videos";

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