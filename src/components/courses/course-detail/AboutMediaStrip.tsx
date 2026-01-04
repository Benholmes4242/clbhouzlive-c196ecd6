import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SquareCardMedia from '@/components/explore/media/SquareCardMedia';
import { CardType } from '@/components/explore/media/CardMediaTypes';
import { adaptClubMediaArrayToExploreItems } from '@/lib/adapters/clubMediaToExplore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubMedia } from '@/hooks/useClubMedia';
import { ChevronRight } from 'lucide-react';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface LocalMediaItem {
  id: string;
  source: 'post' | 'review';
  sourceId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  };
  placeholder?: boolean;
}

interface AboutMediaStripProps {
  clubId: string;
  onSeeAllClick: () => void;
}

const AboutMediaStrip: React.FC<AboutMediaStripProps> = ({ clubId, onSeeAllClick }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Responsive limits: 9 on desktop, 3 on mobile
  const maxItems = isMobile ? 3 : 9;
  // Fetch more to know if there's overflow
  const fetchLimit = isMobile ? 10 : 20;

  // Phase 1 Fix #2: Use shared hook - consumes same cache as CourseMediaTab
  const { data: rawMedia, isLoading: loading } = useClubMedia(clubId, fetchLimit);
  
  // Slice to required limit from cached data
  const items = useMemo(() => {
    if (!rawMedia) return [];
    const sliced = rawMedia.slice(0, maxItems);
    return adaptClubMediaArrayToExploreItems(sliced);
  }, [rawMedia, maxItems]);

  // Helper to extract Stream UID from HLS URL
  const extractStreamUidFromHls = (hls: string) => {
    try {
      const u = new URL(hls);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    } catch { return null; }
  };

  const streamThumb = (uid: string) =>
    generateStreamThumbnailUrl(uid);

  // Build media objects for SquareCardMedia with proper image URLs
  const mediaTiles = (items ?? []).slice(0, maxItems).map((item) => {
    const src = item.src ?? '';
    const isVideo = item.type === 'video';

    if (isVideo) {
      // PRIORITY (videos): item.thumbnailUrl (if it's an image) → thumbnail from UID → fallback
      const uid = extractStreamUidFromHls(src);
      const derivedThumb = uid ? streamThumb(uid) : undefined;

      // If API thumbnailUrl contains ".m3u8", ignore it
      const apiThumb =
        typeof item.media?.[0]?.media_url === 'string' && !item.media[0].media_url.endsWith('.m3u8')
          ? item.media[0].media_url
          : undefined;

      const thumb = apiThumb || derivedThumb;

      return {
        id: item.id,
        media_type: 'video' as const,
        // SquareCardMedia uses poster/thumbnail to render an <img>; give it an image URL (never .m3u8)
        media_url: thumb ?? '/placeholder.svg',
        thumbnail_url: thumb,
        poster_url: thumb,
      };
    }

    // Images (R2): use the image URL for both fields
    const img = item.media?.[0]?.media_url || src;
    return {
      id: item.id,
      media_type: 'image' as const,
      media_url: img || '/placeholder.svg',
      thumbnail_url: img || undefined,
    };
  });

  // Ensure slots with placeholders up to maxItems
  const displayItems = Array.from({ length: maxItems }, (_, i) => mediaTiles[i] || null);

  // Calculate photo and video counts from FULL rawMedia (not sliced mediaTiles)
  // Note: rawMedia uses 'type' field (from edge function), not 'media_type'
  const { photoCount, videoCount, totalCount } = useMemo(() => {
    if (loading || !rawMedia) return { photoCount: 0, videoCount: 0, totalCount: 0 };
    const photos = rawMedia.filter((m: any) => m.type === 'image').length;
    const videos = rawMedia.filter((m: any) => m.type === 'video').length;
    const total = rawMedia.length;
    return { photoCount: photos, videoCount: videos, totalCount: total };
  }, [loading, rawMedia]);

  const hasMedia = mediaTiles.length > 0;
  
  // F2: Calculate overflow count for "+X" indicator
  const overflowCount = totalCount > maxItems ? totalCount - maxItems : 0;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between mb-3 px-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500">
              Course media
            </p>
          </div>
        </div>
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 grid grid-cols-3 gap-[1px]">
          {Array.from({ length: maxItems }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted/70 animate-pulse border border-border/60 sm:border-border/40" />
          ))}
        </div>
      </>
    );
  }

  // Empty state when no media
  if (!hasMedia) {
    return (
      <>
        <div className="px-4 mb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Media
          </h3>
        </div>
        <div className="px-4">
          <div className="rounded-2xl bg-white shadow-sm px-4 py-5 border border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              No photos or videos yet
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Help other golfers discover this course — be the first to share your experience.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/courses/${clubId}/rate`)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition"
            >
              Share your experience
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 px-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Media
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'} · {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </p>
        </div>
        {/* See all CTA with chevron */}
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-slate-900 active:opacity-70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSeeAllClick();
          }}
        >
          <span>See all</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 grid grid-cols-3 gap-[1px]">
        {mediaTiles.map((media, index) => {
          // F2: Show "+X" overlay on last tile if there's more media
          const isLastTile = index === mediaTiles.length - 1;
          const showOverflow = isLastTile && overflowCount > 0;
          
          return (
            <button
              key={media.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeeAllClick();
              }}
              className="relative overflow-hidden w-full aspect-square focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow hover:shadow-md border border-border/60 sm:border-border/40"
              aria-label="Open Media tab"
            >
              <SquareCardMedia
                media={media}
                cardType={CardType.SQUARE}
                className="w-full h-full"
              />
              
              {/* F2: "+X" overflow indicator */}
              {showOverflow && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    +{overflowCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default AboutMediaStrip;
