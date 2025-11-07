import { useMemo } from "react";
import type { VideoItem, ChannelLite, UserLite } from "../types";
import { useInfiniteExploreContent } from "@/hooks/useInfiniteExploreContent";

// ----- Content rules -----
const GOLF_KEYWORDS = [
  "golf","golfer","swing","putt","driver","iron","wedge","tee","bunker",
  "links","fairway","green","putting","course","par","handicap","round",
  "rory","mcilroy","tiger","woods","pga","lpga","ryder","open","masters",
  "range","trackman","simulator","club fitting","par 3","birdie","eagle",
  "bogey","chip","pitch","scramble","bunker shot","tee shot"
];

const KIDS_EXCLUDE = [
  "kids","kid","child","children","toddler","nursery","playtime","cartoon",
  "minecraft","roblox","peppa","paw patrol","cocomelon","toy review","family vlog"
];

// quick text checker
function includesAny(text: string, list: string[]) {
  const t = (text || "").toLowerCase();
  return list.some(k => t.includes(k));
}

// Decide if a post is golf-related
function isGolfPost(post: any) {
  const title = `${post.title ?? ""} ${post.caption ?? ""} ${post.description ?? ""}`;
  const tags = (post.tags ?? []).join(" ").toLowerCase();
  return (
    includesAny(title, GOLF_KEYWORDS) ||
    includesAny(tags, GOLF_KEYWORDS) ||
    (post.category && String(post.category).toLowerCase().includes("golf"))
  );
}

// Exclude kids/family content
function isKids(post: any) {
  const title = `${post.title ?? ""} ${post.caption ?? ""} ${post.description ?? ""}`;
  const chName = post.user?.name ?? post.channelName ?? "";
  return includesAny(title, KIDS_EXCLUDE) || includesAny(chName, KIDS_EXCLUDE);
}

// Fallback golf posters (no blank cards)
const GOLF_POSTER_POOL = [
  "https://images.unsplash.com/photo-1542228262-3d663b306e4a?q=80&w=1200&auto=format",
  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format",
  "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?q=80&w=1200&auto=format",
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format",
];

function golfFallbackPoster(i: number) {
  return GOLF_POSTER_POOL[i % GOLF_POSTER_POOL.length];
}

const users: UserLite[] = Array.from({ length: 8 }, (_, i) => ({
  id: `u${i}`, 
  name: `Golf Pro ${i + 1}`, 
  avatar: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`, 
  verified: i % 2 === 0
}));

export function mkMockVideo(i: number): VideoItem {
  const u = users[i % users.length];
  const titles = [
    "Royal Birkdale Full Round - Championship Course",
    "Final Round Highlights - PGA Championship",
    "My Favorite New Driver Swing Drill",
    "Course Vlog: Pebble Beach Experience",
    "Bunker Shot Masterclass with Top Pro",
    "Tiger Woods Swing Analysis - Every Detail",
    "Augusta National - A Golfer's Dream Round",
    "Pro Tips: Add 20 Yards to Your Drive"
  ];
  
  return {
    id: `mock-${i}`,
    title: titles[i % titles.length],
    poster: golfFallbackPoster(i),
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    durationSec: 60 * ((i % 12) + 3),
    views: 1200 * (i + 1),
    timeAgo: `${(i % 9) + 1} days ago`,
    user: u,
    echoes: (i % 7) * 13,
    tag: ["Tips", "Course Vlog", "Highlights", "Gear"][i % 4] as any,
    course: ["Royal Birkdale", "Pebble Beach", "Augusta National", "St Andrews"][i % 4],
  };
}

function mapRealToVideoItem(post: any, idx: number): VideoItem {
  const poster = post.thumbnailSrc || post.posterUrl || golfFallbackPoster(idx);
  return {
    id: String(post.id ?? `real-${idx}`),
    title: post.title ?? post.caption ?? "Untitled Golf Video",
    poster,
    src: post.videoUrl ?? undefined,
    hlsUrl: post.hlsUrl ?? post.cloudflareHls ?? undefined,
    durationSec: Math.max(180, Number(post.durationSec ?? 0)),
    views: Number(post.viewCount ?? post.plays ?? 0),
    timeAgo: post.timeAgo ?? "today",
    user: {
      id: String(post.user?.id ?? `user-${idx}`),
      name: post.user?.name ?? post.username ?? "Golfer",
      avatar: post.user?.avatar ?? post.userAvatar ?? `https://i.pravatar.cc/100?img=${(idx % 70) + 1}`,
      verified: Boolean(post.user?.verified),
    },
    echoes: Number(post.echoes ?? post.likes ?? 0),
    tag: post.tag ?? (post.category?.toLowerCase().includes("vlog") ? "Course Vlog" : undefined),
    course: post.courseName ?? post.course ?? undefined,
  };
}

export function useVideos2Data(minItems = 20) {
  const { content, loading, hasMore } = useInfiniteExploreContent("videos", undefined, { from: 180, to: null });

  const realAll = content || [];
  const realFiltered = useMemo(() => {
    return realAll
      .filter((p: any) => !isKids(p) && isGolfPost(p))
      .map(mapRealToVideoItem)
      .filter((v: VideoItem) => v.durationSec >= 180);
  }, [realAll]);

  const needed = Math.max(0, minItems - realFiltered.length);
  const mock = useMemo(() => 
    Array.from({ length: needed }, (_, i) => mkMockVideo(i + 1)),
    [needed]
  );

  // Interleave 2 real : 1 mock
  const blended = useMemo(() => {
    const result: VideoItem[] = [];
    let r = 0, m = 0;
    while (result.length < Math.max(minItems, realFiltered.length + mock.length)) {
      if (r < realFiltered.length) result.push(realFiltered[r++]);
      if (r < realFiltered.length) result.push(realFiltered[r++]);
      if (m < mock.length) result.push(mock[m++]);
      if (r >= realFiltered.length && m >= mock.length) break;
    }
    return result.slice(0, Math.max(realFiltered.length, minItems));
  }, [realFiltered, mock, minItems]);

  return {
    videos: blended,
    realCount: realFiltered.length,
    isLoading: loading,
    hasMore,
  };
}

export function getMockShorts(count = 6): VideoItem[] {
  return Array.from({ length: count }, (_, i) => mkMockVideo(100 + i));
}

const GOLF_FACE = "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?q=80&w=300&auto=format";

export function isGolfChannel(c: ChannelLite) {
  const name = (c.name || "").toLowerCase();
  return (
    name.includes("golf") || 
    name.includes("golfer") || 
    name.includes("swing") ||
    name.includes("pro") ||
    name.includes("pga") ||
    name.includes("course")
  );
}

export function getMockChannels(count = 6): ChannelLite[] {
  const names = ["Golf Pro TV", "Swing Coach Mike", "PGA Highlights", "Course Vlogs", "Golf Gear Reviews", "Pro Tips Daily"];
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    name: names[i % names.length],
    avatar: `https://images.unsplash.com/photo-${1500648767791 + i}?w=300&q=80`,
    verified: i % 2 === 0,
    subscribed: false,
  }));
}

export { golfFallbackPoster, GOLF_FACE };
