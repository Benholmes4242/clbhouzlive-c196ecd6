/** Device-only Tour story history. Storage failures suppress every freshness
 * indicator; page reads mark all entrypoints without altering their navigation.
 * The visit hook holds its mount baseline until departure, including after the
 * next baseline is written. Newest opened IDs are deduplicated and capped at 100. */
import { useEffect, useRef, useState } from 'react';
import type { TourStory } from './useTourStories';

export const NEWS_LAST_SEEN = 'tour-news:lastSeenAt';
export const NEWS_OPENED = 'tour-news:openedIds';
const CHANGE = 'tour-news-opened';
export interface NewsVisit { lastSeenAt: number | null; openedIds: string[]; available: boolean }
export function readNewsVisit(): NewsVisit {
  try {
    const stored = localStorage.getItem(NEWS_LAST_SEEN);
    const opened: unknown = JSON.parse(localStorage.getItem(NEWS_OPENED) ?? '[]');
    if (!Array.isArray(opened) || !opened.every(id => typeof id === 'string')) throw new Error('Invalid news history');
    const at = stored == null ? null : Number(stored);
    if (at != null && !Number.isFinite(at)) throw new Error('Invalid news baseline');
    return { lastSeenAt: at, openedIds: opened.slice(0, 100), available: true };
  } catch { return { lastSeenAt: null, openedIds: [], available: false }; }
}
export function markNewsOpened(id: string): boolean {
  const visit = readNewsVisit();
  if (!visit.available) { window.dispatchEvent(new Event(CHANGE)); return false; }
  try {
    localStorage.setItem(NEWS_OPENED, JSON.stringify([id, ...visit.openedIds.filter(old => old !== id)].slice(0, 100)));
    window.dispatchEvent(new Event(CHANGE));
    return true;
  } catch { window.dispatchEvent(new Event(CHANGE)); return false; }
}
export function isNewStory(story: Pick<TourStory, 'id' | 'published_at'>, visit: NewsVisit): boolean {
  return visit.available && visit.lastSeenAt != null && !visit.openedIds.includes(story.id)
    && Date.parse(story.published_at ?? '') > visit.lastSeenAt;
}
export function useNewsVisit() {
  const ref = useRef<HTMLElement | null>(null);
  const [visit, setVisit] = useState(readNewsVisit);
  useEffect(() => {
    const refresh = () => {
      const read = readNewsVisit();
      setVisit(held => ({ ...held, openedIds: read.openedIds, available: held.available && read.available }));
    };
    window.addEventListener(CHANGE, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CHANGE, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined' || !visit.available) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let written = false;
    const cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
    const observer = new IntersectionObserver(entries => {
      cancel();
      if (written || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      timer = setTimeout(() => {
        try { localStorage.setItem(NEWS_LAST_SEEN, String(Date.now())); written = true; }
        catch { setVisit(held => ({ ...held, available: false })); }
      }, 1000);
    }, { threshold: 0.5 });
    observer.observe(ref.current);
    return () => { cancel(); observer.disconnect(); };
  }, [visit.available]);
  return { ref, visit };
}