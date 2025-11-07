export type UserLite = {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
};

export type VideoItem = {
  id: string;
  title: string;
  poster: string;
  src?: string;
  hlsUrl?: string;
  durationSec: number;
  views: number;
  timeAgo: string;
  user: UserLite;
  echoes: number;
  tag?: "Tips" | "Course Vlog" | "Funny" | "Highlights" | "Gear";
  course?: string;
};

export type ChannelLite = {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  subscribed?: boolean;
};

export type VideoFilter = "All" | "Pro Golf" | "Course Vlogs" | "Tips" | "Gear";

export type FeedItemType = 
  | { type: 'wide'; video: VideoItem }
  | { type: 'pair'; videos: [VideoItem, VideoItem] }
  | { type: 'channels'; channels: ChannelLite[] }
  | { type: 'shorts'; videos: VideoItem[] };
