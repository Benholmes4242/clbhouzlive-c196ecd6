/**
 * useBusinessImpression
 *
 * When a business row/card becomes visible in a list (>=50% for ~600ms),
 * fires trackBusinessAnalyticsEvent(content_impression, source='directory').
 * Once per business per session.
 */
import { useEffect, useRef } from 'react';
import { trackBusinessAnalyticsEvent } from '@/lib/businessAnalyticsTracking';
import type { SourceType } from '@/lib/businessAnalyticsTracking';

const RECORDED = new Set<string>();
const DWELL_MS = 600;

export function useBusinessImpression(
  businessId: string | undefined,
  source: SourceType = 'directory',
): (el: HTMLElement | null) => void {
  const timerRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, []);

  return (el: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const key = businessId ? `${source}:${businessId}` : '';
    if (!el || !businessId || RECORDED.has(key)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timerRef.current == null) {
            timerRef.current = window.setTimeout(() => {
              timerRef.current = null;
              RECORDED.add(key);
              void trackBusinessAnalyticsEvent({
                businessId,
                eventType: 'content_impression',
                source,
              });
              io.disconnect();
              observerRef.current = null;
            }, DWELL_MS);
          }
        } else if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    observerRef.current = io;
  };
}
