import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SquareCardMedia from '@/components/explore/media/SquareCardMedia';
import { CardType } from '@/components/explore/media/CardMediaTypes';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';

interface MediaItem {
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

  // Build media objects for SquareCardMedia
  const mediaTiles = items.slice(0, 3).map((item) => {
    if (item.type === 'video') {
      const uid = extractStreamUidFromHls(item.src);
      const thumb = item.media?.[0]?.media_url || (uid ? streamThumb(uid) : undefined);
      return {
        id: item.id,
        media_type: 'video' as const,
        media_url: thumb || '',
        thumbnail_url: thumb,
        poster_url: thumb,
      };
    }
    // image
    return {
      id: item.id,
      media_type: 'image' as const,
      media_url: item.src,
      thumbnail_url: item.media?.[0]?.media_url || item.src,
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
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSeeAllClick();
          }}
        >
          See all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {displayItems.map((item, index) =>
          item ? (
            <div
              key={item.id}
              className="aspect-[4/3] rounded-xl overflow-hidden pointer-events-none"
            >
              <SquareCardMedia
                media={item}
                cardType={CardType.SQUARE}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div
              key={`placeholder-${index}`}
              className="aspect-[4/3] bg-muted rounded-xl"
            />
          )
        )}
      </div>
    </div>
  );
};

export default AboutMediaStrip;