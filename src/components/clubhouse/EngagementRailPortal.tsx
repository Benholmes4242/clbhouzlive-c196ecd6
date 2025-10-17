import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EngagementRail from './EngagementRail';
import { useActivePostWithHysteresis } from '@/hooks/useActivePostWithHysteresis';

type Props = { 
  getAllCardEls: () => HTMLElement[];
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: () => void;
  likedPosts?: string[];
};

export function EngagementRailPortal({ getAllCardEls, onLike, onComment, onShare, likedPosts }: Props) {
  // Keep cards in state and refresh when DOM changes so IO can attach properly
  const [cardEls, setCardEls] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const update = () => setCardEls(getAllCardEls());
    update();

    const root = (document.querySelector('.clubhouse-scroll') as HTMLElement) || document.body;
    const mo = new MutationObserver(() => update());
    mo.observe(root, { childList: true, subtree: true });

    window.addEventListener('resize', update);
    // capture scroll events from any scrollable ancestor
    window.addEventListener('scroll', update, true);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [getAllCardEls]);

  const activeId = useActivePostWithHysteresis(cardEls);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Find anchor for active post
  useEffect(() => {
    if (!activeId) { setHost(null); return; }
    const anchor = document.querySelector<HTMLElement>(`[data-rail-anchor][data-postid="${activeId}"]`);
    setHost(anchor || null);
  }, [activeId]);

  // FLIP: animate from previous position to new anchor
  useLayoutEffect(() => {
    const rail = railRef.current;
    const target = host;
    if (!rail || !target) return;

    // FIRST: old bbox (where rail currently is in viewport coords)
    const first = rail.getBoundingClientRect();

    // Move DOM: append rail into the new host (no paint yet)
    target.appendChild(rail);

    // LAST: new bbox
    const last = rail.getBoundingClientRect();

    // INVERT delta
    const dx = first.left - last.left;
    const dy = first.top - last.top;

    // PLAY
    rail.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: 'translate(0, 0)' }
      ],
      { duration: 200, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' }
    );
  }, [host]);

  if (!host) return null;

  // Get post data from the anchor's dataset
  const postElement = host.closest('[data-postid]');
  const postId = postElement?.getAttribute('data-postid') || '';
  const isLiked = likedPosts?.includes(postId) ?? false;
  const likes = parseInt(postElement?.getAttribute('data-likes') || '0', 10);
  const comments = parseInt(postElement?.getAttribute('data-comments') || '0', 10);
  const shares = parseInt(postElement?.getAttribute('data-shares') || '0', 10);
  const isVideo = postElement?.getAttribute('data-is-video') === 'true';

  return createPortal(
    <div
      ref={railRef}
      className="engagement-rail-portal chrome-follow-bottom"
      data-test="engagement-rail-portal"
      style={{ pointerEvents: 'none' }}
    >
      <div className="engagement-rail-surface" style={{ pointerEvents: 'auto' }}>
        <EngagementRail
          postId={postId}
          stats={{ likes, comments, shares }}
          isLiked={isLiked}
          isVideo={isVideo}
          isActive={true}
          onLike={() => onLike(postId)}
          onComment={() => onComment(postId)}
          onShare={onShare}
        />
      </div>
    </div>,
    host
  );
}
