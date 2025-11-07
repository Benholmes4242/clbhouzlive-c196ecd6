export type UserLite = { id: string; name: string; avatar: string; verified?: boolean };
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
export type ChannelLite = { id: string; name: string; avatar: string; verified?: boolean; subscribed?: boolean };
