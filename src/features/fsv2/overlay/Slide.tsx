/**
 * Slide — one post. Multi-media posts render a horizontal scroll-snap
 * pager and write `activePagerIdx` back to the store on scroll (single
 * source of truth for the dots).
 */

import React, { useEffect, useMemo, useRef } from 'react';

import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

import { FSV2 } from '../tokens';
import { useFsv2Store } from '../store/fsv2Store';
import { traceSlide } from '../perf/trace';
import { registerSlideEl } from '../debug/hudBus';
import { Fsv2ImageSlot } from './ImageSlot';
import { Fsv2VideoSlot } from './VideoSlot';

interface Props {
  post: FeedPost;
  active: boolean;
  openId: string;
  startPosition: number;
  startMediaIndex: number;
  safeAreaBottom: number;
  onFirstReveal?: () => void;
}

function pickPoster(m: MediaItem): string | null {
  return (m as unknown as { posterUrl?: string | null }).posterUrl ?? null;
}

export const Fsv2Slide: React.FC<Props> = ({
  post,
  active,
  openId,
  startPosition,
  startMediaIndex,
  safeAreaBottom,
  onFirstReveal,
}) => {
  const setActivePagerIdx = useFsv2Store((s) => s.setActivePagerIdx);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const items = post.mediaItems ?? [];
  const singleton = items.length <= 1;
  const startIdx = useMemo(
    () => Math.max(0, Math.min(startMediaIndex, Math.max(0, items.length - 1))),
    [startMediaIndex, items.length],
  );

  // Initial scroll to startIdx (multi-media only).
  useEffect(() => {
    if (singleton) return;
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w > 0 && startIdx > 0) {
      el.scrollLeft = startIdx * w;
      setActivePagerIdx(startIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleton, startIdx]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    setActivePagerIdx(idx);
  };

  useEffect(() => {
    if (!active) return;
    traceSlide(openId, { postId: post.id, mediaCount: items.length });
    registerSlideEl(openId, scrollerRef.current);
  }, [active, openId, post.id, items.length]);

  const renderItem = (m: MediaItem, idx: number, isActive: boolean) => {
    const type = m.type;
    if (type === 'video') {
      const src = {
        hlsUrl: (m as unknown as { hlsUrl?: string }).hlsUrl,
        mp4Url: (m as unknown as { mp4Url?: string; url?: string }).mp4Url
          ?? (m as unknown as { url?: string }).url,
      };
      return (
        <Fsv2VideoSlot
          key={m.id ?? idx}
          source={src}
          posterUrl={pickPoster(m)}
          active={isActive}
          openId={openId}
          startPosition={idx === startIdx ? startPosition : 0}
          safeAreaBottom={safeAreaBottom}
          onFirstReveal={idx === startIdx ? onFirstReveal : undefined}
        />
      );
    }
    const imageUrl =
      (m as unknown as { imageUrl?: string }).imageUrl
      ?? (m as unknown as { url?: string }).url
      ?? '';
    return (
      <Fsv2ImageSlot
        key={m.id ?? idx}
        imageUrl={imageUrl}
        posterUrl={pickPoster(m)}
        active={isActive}
        openId={openId}
        onFirstReveal={idx === startIdx ? onFirstReveal : undefined}
      />
    );
  };

  if (singleton) {
    const m = items[0];
    if (!m) return <div style={{ position: 'absolute', inset: 0, background: FSV2.BACKDROP }} />;
    return (
      <div style={{ position: 'absolute', inset: 0, background: FSV2.BACKDROP }}>
        {renderItem(m, 0, active)}
      </div>
    );
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        background: FSV2.BACKDROP,
      }}
    >
      {items.map((m, i) => (
        <div
          key={m.id ?? i}
          style={{
            position: 'relative',
            flex: '0 0 100%',
            width: '100%',
            height: '100%',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
          }}
        >
          {renderItem(m, i, active && i === startIdx)}
        </div>
      ))}
    </div>
  );
};
