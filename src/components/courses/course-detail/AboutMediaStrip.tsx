import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SquareCardMedia from '@/components/explore/media/SquareCardMedia';
import { CardType } from '@/components/explore/media/CardMediaTypes';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';
import { useIsMobile } from '@/hooks/use-mobile';

import { MediaItem } from '@/types/media';

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
  const [items, setItems] = useState<ExploreContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  // Responsive limits: 9 on desktop, 3 on mobile
  const maxItems = isMobile ? 3 : 9;

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-club-media', {
          body: { clubId, limit: maxItems }
        });

        if (error) {
          console.error('Error fetching media:', error);
          setItems([]);
        } else {
          // Use edges array and adapt to ExploreContentItem format
          const rawMedia = data?.edges?.slice(0, maxItems) || [];
          const adaptedItems = adaptClubMediaArrayToExploreItems(rawMedia);
          setItems(adaptedItems);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchMedia();
    }
  }, [clubId, maxItems]);

  // Helper to extract Stream UID from HLS URL
  const extractStreamUidFromHls = (hls: string) => {
    try {
      const u = new URL(hls);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    } catch { return null; }
  };

  const streamThumb = (uid: string) =>
    `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;

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

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">Media</h2>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: maxItems }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted/70 rounded-xl animate-pulse border border-border/60 sm:border-border/40" />
          ))}
        </div>
      </>
    );
  }

  const hasMedia = mediaTiles.length > 0;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold">Media</h2>
        {hasMedia && (
          <button
            type="button"
            className="text-xs font-medium text-foreground hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onSeeAllClick();
            }}
          >
            See all
          </button>
        )}
      </div>

      {!hasMedia ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 px-4 py-6 text-sm text-muted-foreground text-center">
          <p>No media for this course yet.</p>
          <p className="font-medium mt-3">
            Review this course and add media or tag this course to be the first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {mediaTiles.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeeAllClick();
              }}
              className="rounded-xl overflow-hidden w-full aspect-square focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:scale-[1.02] border border-border/60 sm:border-border/40"
              aria-label="Open Media tab"
            >
              <SquareCardMedia
                media={media}
                cardType={CardType.SQUARE}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default AboutMediaStrip;