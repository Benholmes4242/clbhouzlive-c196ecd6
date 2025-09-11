import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SquareCardMedia from '@/components/explore/media/SquareCardMedia';
import { CardType } from '@/components/explore/media/CardMediaTypes';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';

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

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-club-media', {
          body: { clubId, limit: 6 }
        });

        if (error) {
          console.error('Error fetching media:', error);
          setItems([]);
        } else {
          // Use edges array and adapt to ExploreContentItem format
          const rawMedia = data?.edges?.slice(0, 3) || [];
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
  }, [clubId]);

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
  const mediaTiles = (items ?? []).slice(0, 3).map((item) => {
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

  // Ensure exactly 3 slots with placeholders
  const displayItems = Array.from({ length: 3 }, (_, i) => mediaTiles[i] || null);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">Media</h3>
          <div className="w-12 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">Media</h3>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSeeAllClick();
          }}
        >
          See all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => {
          const media = mediaTiles[i];
          return media ? (
            <button
              key={media.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeeAllClick();
              }}
              className="rounded-xl overflow-hidden w-full aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:scale-[1.02]"
              aria-label="Open Media tab"
            >
              <SquareCardMedia
                media={media}
                cardType={CardType.SQUARE}
                className="w-full h-full"
              />
            </button>
          ) : (
            <div key={`ph-${i}`} className="rounded-xl bg-muted aspect-[4/3]" />
          );
        })}
      </div>
    </div>
  );
};

export default AboutMediaStrip;