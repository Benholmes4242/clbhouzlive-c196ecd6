import React, { useState } from 'react';
import { Play, Camera } from 'lucide-react';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
}

interface ReviewMediaStripProps {
  media: ReviewMediaItem[];
  onMediaClick: (index: number, el: HTMLElement | null) => void;
  /** 'default' = 96px thumbnails, 'compact' = 70px thumbnails for inline review cards */
  variant?: 'default' | 'compact';
  /**
   * ADDITIVE (BRIEF_REVIEWS_TAB_REBUILD §4d). Omit all of these and the strip
   * renders exactly as before: fixed squares, wrapping.
   * 'equal' = tiles share the row width equally, no wrap.
   */
  tileMode?: 'fixed' | 'equal';
  /** Tile height in px. Defaults to the variant's square size. */
  tileHeight?: number;
  /** Corner radius in px. Defaults to the variant's radius. */
  tileRadius?: number;
  /** Gap in px. Defaults to the variant's gap. */
  tileGap?: number;
  /** Cap on tiles rendered. Defaults to no cap. */
  maxItems?: number;
}

/** Individual thumbnail with shimmer, fade-in, and error fallback */
const ReviewMediaThumb: React.FC<{
  item: ReviewMediaItem;
  index: number;
  onMediaClick: (index: number, el: HTMLElement | null) => void;
  dim: number;
  radius: number;
  /** When true the tile flexes to share the row instead of being a fixed square. */
  equal?: boolean;
}> = ({ item, index, onMediaClick, dim, radius, equal }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const isVideo = item.media_type === 'video';
  const src = isVideo ? (item.poster_url || item.media_url) : item.media_url;

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => onMediaClick(index, btnRef.current)}

      style={{
        position: 'relative',
        ...(equal
          ? { flex: 1, minWidth: 0 }
          : { flexShrink: 0, width: dim }),
        height: dim,
        borderRadius: radius,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {/* Shimmer placeholder */}
      {!isLoaded && !isBroken && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)' }} />
      )}

      {/* Broken image fallback */}
      {isBroken && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Camera style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.62)' }} />
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
            className={CHIP_GLASS_CLASS}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
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
  tileMode = 'fixed',
  tileHeight,
  tileRadius,
  tileGap,
  maxItems,
}) => {
  if (!media || media.length === 0) return null;

  const isCompact = variant === 'compact';
  const thumbDim = tileHeight ?? (isCompact ? 70 : 96);
  const radius = tileRadius ?? (isCompact ? 9 : 12);
  const gap = tileGap ?? (isCompact ? 5 : 8);
  const equal = tileMode === 'equal';
  const items = maxItems ? media.slice(0, maxItems) : media;

  return (
    <div style={{ display: 'flex', gap, flexWrap: equal ? 'nowrap' : 'wrap' }}>
      {items.map((item, index) => (
        <ReviewMediaThumb
          key={item.id}
          item={item}
          index={index}
          onMediaClick={onMediaClick}
          dim={thumbDim}
          radius={radius}
          equal={equal}
        />
      ))}
    </div>
  );
};
