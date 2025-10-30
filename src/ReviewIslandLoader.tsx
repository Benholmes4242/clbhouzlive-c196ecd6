'use client';
import { useEffect } from 'react';

export function ReviewIslandLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('review') === '1' || q.get('review') === 'true') {
      import('./review-island/bootstrap').then(m => m.initDesignReviewIsland());
    }
  }, []);
  return null;
}
