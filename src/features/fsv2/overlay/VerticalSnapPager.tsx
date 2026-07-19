/**
 * VerticalSnapPager — one post per page, ±1 render window. Vertical
 * scroll-snap; swipe-down at index 0 is handled by the overlay (not
 * here — this component just paginates).
 */

import React, { useEffect, useRef } from 'react';

import type { FeedPost } from '@/components/media-system/types/media';

import { FSV2 } from '../tokens';
import { useFsv2Store } from '../store/fsv2Store';
import { Fsv2Slide } from './Slide';

interface Props {
  posts: FeedPost[];
  activeIndex: number;
  openId: string;
  startPosition: number;
  initialMediaIndex: number;
  safeAreaBottom: number;
  onFirstReveal?: () => void;
}

export const Fsv2VerticalSnapPager: React.FC<Props> = ({
  posts,
  activeIndex,
  openId,
  startPosition,
  initialMediaIndex,
  safeAreaBottom,
  onFirstReveal,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const setActiveIndex = useFsv2Store((s) => s.setActiveIndex);
  const didInitRef = useRef(false);

  // Initial vertical scroll to startIndex.
  useEffect(() => {
    if (didInitRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    if (h > 0 && activeIndex > 0) {
      el.scrollTop = activeIndex * h;
    }
    didInitRef.current = true;
  }, [activeIndex]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const h = el.clientHeight || 1;
    const idx = Math.round(el.scrollTop / h);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        background: FSV2.BACKDROP,
      }}
    >
      {posts.map((post, i) => {
        const withinWindow = Math.abs(i - activeIndex) <= 1;
        return (
          <div
            key={post.id ?? i}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {withinWindow ? (
              <Fsv2Slide
                post={post}
                active={i === activeIndex}
                openId={openId}
                startPosition={i === activeIndex ? startPosition : 0}
                startMediaIndex={i === activeIndex ? initialMediaIndex : 0}
                safeAreaBottom={safeAreaBottom}
                onFirstReveal={i === activeIndex ? onFirstReveal : undefined}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
