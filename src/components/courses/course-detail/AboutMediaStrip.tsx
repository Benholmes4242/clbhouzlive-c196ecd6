import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [items, setItems] = useState<MediaItem[]>([]);
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
          setItems(data?.edges?.slice(0, 3) || []);
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

  // Ensure exactly 3 slots
  const filledItems = [...items];
  while (filledItems.length < 3) {
    filledItems.push({ 
      id: `placeholder-${filledItems.length}`, 
      placeholder: true 
    } as any);
  }

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
        {filledItems.map((item) =>
          item.placeholder ? (
            <div
              key={item.id}
              className="aspect-[4/3] bg-muted rounded-xl"
            />
          ) : (
            <div
              key={item.id}
              className="aspect-[4/3] rounded-xl overflow-hidden pointer-events-none"
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AboutMediaStrip;