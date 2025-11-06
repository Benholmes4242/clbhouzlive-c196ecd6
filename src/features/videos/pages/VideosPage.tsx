import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAutoplay } from "../hooks/useAutoplay";
import VideoCard from "../components/VideoCard";
import ShortsCarousel from "../components/ShortsCarousel";
import SuggestedProfiles from "../components/SuggestedProfiles";
import SmartPlaylistBar from "../components/SmartPlaylistBar";
import FilterBar from "../components/FilterBar";
import type { VideoItem, ProfileItem } from "../types";
import { useInfiniteExploreContent } from "@/hooks/useInfiniteExploreContent";
import { FILTER_TYPES } from "@/components/explore/types";

/**
 * Main Videos page with virtualized feed, unified autoplay, and interleaved rails
 * Path B - Full re-architecture with world-class UX
 */
export default function VideosPage() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { register } = useAutoplay<HTMLVideoElement>(0.75);

  // Fetch real video content
  const { content: videoContent, loading } = useInfiniteExploreContent(
    FILTER_TYPES.VIDEOS,
    undefined,
    undefined
  );

  // Fetch Shorts content for the carousel
  const { content: shortsContent } = useInfiniteExploreContent(
    FILTER_TYPES.VIDEOS,
    undefined,
    { from: 0, to: 60 } // Shorts duration filter
  );

  // Transform content to VideoItem format
  const videos: VideoItem[] = (videoContent || []).map(post => ({
    id: post.id,
    src: post.src,
    poster: post.thumbnailSrc,
    user: {
      id: post.user?.id || '',
      name: post.user?.name || 'Unknown',
      avatar: post.user?.avatar || '/placeholder.svg',
      verified: post.user?.verified
    },
    caption: post.title,
    likes: post.likes || 0,
    comments: post.comments,
    course: post.golfCourse?.name,
    durationSec: post.durationSeconds
  }));

  const shorts: VideoItem[] = (shortsContent || []).slice(0, 8).map(post => ({
    id: post.id,
    src: post.src,
    poster: post.thumbnailSrc,
    user: {
      id: post.user?.id || '',
      name: post.user?.name || 'Unknown',
      avatar: post.user?.avatar || '/placeholder.svg',
      verified: post.user?.verified
    },
    caption: post.title,
    likes: post.likes || 0,
    course: post.golfCourse?.name
  }));

  // Mock profiles for now - can be replaced with real data
  const profiles: ProfileItem[] = [];

  // Interleave content: videos + rails
  const items = [
    ...videos.slice(0, 3),
    "SHORTS",
    ...videos.slice(3, 7),
    ...(profiles.length > 0 ? ["PROFILES"] : []),
    ...videos.slice(7),
  ] as const;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (typeof items[i] === "string" ? 360 : window.innerHeight * 0.7 + 16),
    overscan: 5,
  });

  // Compute "Up next" from the first video after the first visible
  const firstVisibleIdx = rowVirtualizer.getVirtualItems()[0]?.index ?? 0;
  const nextPlayable = items.slice(firstVisibleIdx + 1).find((x) => x !== "SHORTS" && x !== "PROFILES") as VideoItem | undefined;

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-gray-400">Loading videos…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Filter bar */}
      <FilterBar active="All" />

      {/* Virtualized scroll container */}
      <div ref={parentRef} className="relative h-[calc(100vh-180px)] overflow-auto no-scrollbar">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const item = items[vi.index];
            const style: React.CSSProperties = {
              position: "absolute",
              top: 0, left: 0, right: 0,
              transform: `translateY(${vi.start}px)`,
              paddingBottom: 16,
            };

            if (item === "SHORTS") {
              return (
                <div key={vi.key} style={style}>
                  <ShortsCarousel items={shorts} />
                </div>
              );
            }
            if (item === "PROFILES") {
              return (
                <div key={vi.key} style={style}>
                  <SuggestedProfiles items={profiles} />
                </div>
              );
            }
            return (
              <div key={vi.key} style={style} className="-mx-[4px]">
                <VideoCard item={item as VideoItem} register={(el) => register(el, vi.index)} />
              </div>
            );
          })}
        </div>
      </div>

      <SmartPlaylistBar next={nextPlayable} />
    </div>
  );
}
