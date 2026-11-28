/** One arrival alignment through Virtuoso's measured item sizes and inner scroller.
 * The author card can follow a rail within an item, so include its local offset.
 * No page/window scrolling and no separate impression are introduced here. */
import { useEffect, useRef, type RefObject } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { chromeClearancePx } from '@/lib/chromeClearance';
import type { FeedPostArrival } from '@/components/clubhouse/hooks/useClubhousePostArrival';

export function useFeedPostArrivalScroll({ arrival, ids, virtuoso, cards, ready, onPlaced }: {
  arrival?: FeedPostArrival | null;
  ids: (string | null)[];
  virtuoso: RefObject<VirtuosoHandle | null>;
  cards: RefObject<Map<number, HTMLElement>>;
  ready: boolean;
  onPlaced?: (key: string) => void;
}) {
  const consumed = useRef<string | null>(null);
  const latest = useRef({ ids, onPlaced });
  latest.current = { ids, onPlaced };
  useEffect(() => {
    if (!arrival || !ready || consumed.current === arrival.key) return;
    const index = ids.indexOf(arrival.id);
    if (index < 0) { onPlaced?.(arrival.key); return; }
    let frame = 0;
    // Allow layout and Virtuoso's ResizeObserver measurement to settle first.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const handle = virtuoso.current;
        if (!handle || consumed.current === arrival.key) return;
        consumed.current = arrival.key;
        if (arrival.pinned) {
          handle.scrollTo({ top: 0 });
          latest.current.onPlaced?.(arrival.key);
          return;
        }
        handle.scrollIntoView({
          index,
          behavior: 'smooth',
          align: 'start',
          calculateViewLocation: ({ locationParams }) => {
            const card = Array.from(cards.current?.values() ?? []).find(el => el.dataset.postId === arrival.id);
            const item = card?.closest('[data-index]');
            const inset = card && item ? card.getBoundingClientRect().top - item.getBoundingClientRect().top : 0;
            return { ...locationParams, index, align: 'start', offset: inset - chromeClearancePx() };
          },
          done: () => latest.current.onPlaced?.(arrival.key),
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [arrival, ids, ready, virtuoso, cards, onPlaced]);
}