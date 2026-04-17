import React, { useState } from 'react';
import { Play, Camera } from 'lucide-react';

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
}

interface ReviewMediaStripProps {
  media: ReviewMediaItem[];
  onMediaClick: (index: number) => void;
  /** 'default' = 96px thumbnails, 'compact' = 70px thumbnails for inline review cards */
  variant?: 'default' | 'compact';
}

/** Individual thumbnail with shimmer, fade-in, and error fallback */
const ReviewMediaThumb: React.FC<{
  item: ReviewMediaItem;
  index: number;
  onMediaClick: (index: number) => void;
  dim: number;
  radius: number;
}> = ({ item, index, onMediaClick, dim, radius }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const isVideo = item.media_type === 'video';
  const src = isVideo ? (item.poster_url || item.media_url) : item.media_url;

  return (
    <button
      type="button"
      onClick={() => onMediaClick(index)}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: dim,
        height: dim,
        borderRadius: radius,
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.04)',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {/* Shimmer placeholder */}
      {!isLoaded && !isBroken && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.06)' }} />
      )}

      {/* Broken image fallback */}
      {isBroken && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Camera style={{ width: 18, height: 18, color: 'rgba(15,23,42,0.3)' }} />
        </div>
      )}

      {/* Image with fade-in */}
      {!isBroken && (
        <img
          src={src}
          alt={isVideo ? 'Video thumbnail' : 'Review media'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 200ms',
          }}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsBroken(true)}
        />
      )}

      {/* Video play overlay — simple dark circle */}
      {isVideo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play style={{ width: 10, height: 10, color: '#fff', fill: '#fff', transform: 'translateX(1px)' }} />
          </div>
        </div>
      )}
    </button>
  );
};

export const ReviewMediaStrip: React.FC<ReviewMediaStripProps> = ({
  media,
  onMediaClick,
  variant = 'default',
}) => {
  if (!media || media.length === 0) return null;

  const isCompact = variant === 'compact';
  const thumbDim = isCompact ? 70 : 96;
  const radius = isCompact ? 9 : 12;
  const gap = isCompact ? 5 : 8;

  return (
    <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>
      {media.map((item, index) => (
        <ReviewMediaThumb
          key={item.id}
          item={item}
          index={index}
          onMediaClick={onMediaClick}
          dim={thumbDim}
          radius={radius}
        />
      ))}
    </div>
  );
};
