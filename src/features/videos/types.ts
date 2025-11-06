// Core types for the videos feature
export type UserLite = {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
};

export type VideoItem = {
  id: string;
  src?: string;           // MP4 (Shorts/grid)
  hlsUrl?: string;        // Cloudflare Stream HLS (long videos)
  poster?: string;
  user: UserLite;
  caption?: string;
  likes: number;
  comments?: number;
  course?: string;
  durationSec?: number;
};

export type ProfileItem = {
  id: string;
  name: string;
  club?: string;
  avatar: string;
  verified?: boolean;
};
