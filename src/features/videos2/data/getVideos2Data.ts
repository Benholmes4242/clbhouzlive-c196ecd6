import { useMemo } from "react";
import type { VideoItem, ChannelLite, UserLite } from "../types";
import { useInfiniteExploreContent } from "@/hooks/useInfiniteExploreContent";

const FALLBACK_POSTER = "https://picsum.photos/seed/fallback/1200/675";
const FALLBACK_SRC = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const users: UserLite[] = Array.from({ length: 8 }, (_, i) => ({
  id: `u${i}`,
  name: ["Michael Campbell", "Ethan Williams", "Daniel Carlson", "Sarah Chen", "James Rodriguez", "Emma Watson", "Lucas Kim", "Olivia Martinez"][i] || `Golfer ${i + 1}`,
  avatar: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
  verified: i % 3 === 0
}));

export function mkMockVideo(i: number): VideoItem {
  const u = users[i % users.length];
  const titles = [
    "Royal Birkdale Full Round - Breaking 80",
    "Final Round Highlights: US Open",
    "My Favorite New Swing Drill for Distance",
    "Course Vlog: Pebble Beach Experience",
    "Breaking Down Tiger's Iron Play",
    "How I Fixed My Slice in 30 Days",
    "Augusta National: Every Hole Breakdown",
    "Best Golf Tips from a PGA Pro"
  ];
  return {
    id: `mock-${i}`,
    title: titles[i % titles.length],
    poster: `https://picsum.photos/seed/v${i}/1200/675`,
    src: FALLBACK_SRC,
    durationSec: 60 * ((i % 12) + 3),
    views: 1200 * (i + 1) + 214,
    timeAgo: `${(i % 9) + 1} days ago`,
    user: u,
    echoes: (i % 7) * 13 + 5,
    tag: ["Tips", "Course Vlog", "Highlights", "Funny"][i % 4] as any,
    course: ["Royal Birkdale", "Pebble Beach", "Bearwood Lakes", "Augusta National"][i % 4],
  };
}

function mapRealToVideoItem(post: any, idx: number): VideoItem {
  const durationSec = Number(post.durationSec ?? post.duration ?? 0);
  
  return {
    id: String(post.id ?? `real-${idx}`),
    title: post.title ?? post.caption ?? "Untitled Video",
    poster: post.thumbnailSrc ?? post.posterUrl ?? post.thumbnail ?? FALLBACK_POSTER,
    src: post.videoUrl ?? post.src ?? undefined,
    hlsUrl: post.hlsUrl ?? post.cloudflareHls ?? undefined,
    durationSec: Math.max(180, durationSec),
    views: Number(post.viewCount ?? post.plays ?? post.views ?? 0),
    timeAgo: post.timeAgo ?? "today",
    user: {
      id: String(post.user?.id ?? post.userId ?? `user-${idx}`),
      name: post.user?.name ?? post.username ?? post.user?.username ?? "Unknown",
      avatar: post.user?.avatar ?? post.userAvatar ?? post.user?.avatarUrl ?? `https://i.pravatar.cc/100?img=${(idx % 70) + 1}`,
      verified: Boolean(post.user?.verified),
    },
    echoes: Number(post.echoes ?? post.likes ?? post.likeCount ?? 0),
    tag: post.tag ?? undefined,
    course: post.courseName ?? post.course ?? post.location ?? undefined,
  };
}

export function useVideos2Data(minItems = 20) {
  const { content, loading } = useInfiniteExploreContent("All", undefined, { from: 180, to: null });

  const real: VideoItem[] = useMemo(() => {
    if (!content || !Array.isArray(content)) return [];
    
    const items = content
      .map((post, idx) => mapRealToVideoItem(post, idx))
      .filter((v: VideoItem) => v.durationSec >= 180);
    
    return items;
  }, [content]);

  const needed = Math.max(0, minItems - real.length);
  const mock = Array.from({ length: needed }, (_, i) => mkMockVideo(i + 1));

  const blended: VideoItem[] = [];
  let r = 0, m = 0;
  
  while (blended.length < Math.max(minItems, real.length + mock.length)) {
    if (r < real.length) blended.push(real[r++]);
    if (r < real.length) blended.push(real[r++]);
    if (m < mock.length) blended.push(mock[m++]);
    if (r >= real.length && m >= mock.length) break;
  }

  return {
    videos: blended.slice(0, Math.max(real.length, minItems)),
    realCount: real.length,
    isLoading: loading,
    isError: false,
  };
}

export function getMockShorts(count = 6): VideoItem[] {
  return Array.from({ length: count }, (_, i) => {
    const base = mkMockVideo(100 + i);
    return { ...base, durationSec: 30 + (i % 3) * 15 };
  });
}

export function getMockChannels(count = 6): ChannelLite[] {
  const names = ["PGA Tour", "Rick Shiels", "Good Good Golf", "Fore Play", "No Laying Up", "Peter Finch Golf"];
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    name: names[i] || `Channel ${i + 1}`,
    avatar: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
    verified: i % 2 === 0,
    subscribed: false,
  }));
}
