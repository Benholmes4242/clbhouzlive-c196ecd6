/**
 * usePostViewTracker
 *
 * Fires ONCE per post per session when the post is >=50% visible for ~1s.
 * Writes a row into public.post_views (post_id, viewer_id).
 *
 * Fire-and-forget: never blocks UI, never surfaces errors to the user.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

const RECORDED = new Set<string>();
const DWELL_MS = 1000;

let cachedViewerId: string | null | undefined;
async function getViewerId(): Promise<string | null> {
  if (cachedViewerId !== undefined) return cachedViewerId ?? null;
  try {
    const { data } = await supabase.auth.getUser();
    cachedViewerId = data.user?.id ?? null;
  } catch {
    cachedViewerId = null;
  }
  return cachedViewerId ?? null;
}

async function recordPostView(postId: string) {
  if (!postId || RECORDED.has(postId)) return;
  RECORDED.add(postId);
  try {
    const viewer_id = await getViewerId();
    const { error } = await supabase
      .from('post_views')
      .insert({ post_id: postId, viewer_id });
    if (error) {
      // Row may already exist; that's fine.
      AppLog.warn?.('[post_views]', 'insert failed', error.message);
    }
  } catch (err) {
    AppLog.warn?.('[post_views]', 'record error', err);
  }
}

/**
 * Attach to an element. When `enabled` and visible >= 50% for ~1s, records.
 */
export function usePostViewTracker(
  postId: string | undefined,
  enabled: boolean = true,
): (el: HTMLElement | null) => void {
  const elRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, []);

  return (el: HTMLElement | null) => {
    if (elRef.current === el) return;
    elRef.current = el;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!el || !postId || !enabled || RECORDED.has(postId)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timerRef.current == null) {
            timerRef.current = window.setTimeout(() => {
              timerRef.current = null;
              recordPostView(postId);
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

/**
 * Fire-and-forget one-shot recorder (for surfaces where an observer isn't
 * needed — e.g. single-post view where being on the page implies a view).
 */
export function recordPostViewOnce(postId: string | undefined) {
  if (!postId) return;
  void recordPostView(postId);
}
