/**
 * BRIEF_WHATS_BEEN_PLAYED_V4 §3 — `?section=lately` on the course page
 * (courseLatelyHref). Read ONCE at mount: wait for CourseLatelySection's
 * [data-course-lately="ready"], scroll it to sit just under the top islands
 * (chromeClearancePx) on its real scroll owner, then remove `section` with
 * replace so back/refresh never re-scroll. The tab itself comes from `tab=`,
 * which GolfClubView already reads. When Lately is not rendered (no rounds,
 * error, signed out) the page stays at the tab top and the param is cleared.
 */
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chromeClearancePx } from '@/lib/chromeClearance';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { LATELY_SECTION } from '@/lib/courses/courseLatelyLink';

/** Longest wait for the section before landing on the tab top. */
export const LATELY_WAIT_MS = 10_000;

export function useLatelyDeepLink(disabled = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const wanted = useRef(!disabled && searchParams.get('section') === LATELY_SECTION);
  const setRef = useRef(setSearchParams);
  setRef.current = setSearchParams;
  useEffect(() => {
    if (!wanted.current) return;
    let stopped = false;
    let sawLoading = false;
    const stop = () => { stopped = true; observer.disconnect(); window.clearTimeout(timer); };
    const finish = () => {
      if (stopped) return;
      stop();
      wanted.current = false;
      setRef.current((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('section');
        return next;
      }, { replace: true });
    };
    const check = () => {
      if (stopped) return;
      const el = document.querySelector('[data-course-lately]');
      const state = el?.getAttribute('data-course-lately');
      if (state === 'ready' && el) {
        scrollElementIntoView(el, { offset: chromeClearancePx() });
        finish();
      } else if (state === 'loading') {
        sawLoading = true;
      } else if (state === 'error' || (sawLoading && !el)) {
        finish();
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-course-lately'] });
    const timer = window.setTimeout(finish, LATELY_WAIT_MS);
    check();
    return () => { if (!stopped) stop(); };
  }, []);
}
