/**
 * Echo Deep Link Hook
 * Handles URL parameters for time seeking and anchor scrolling
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UseEchoDeepLinkOptions {
  onSeek?: (time: number) => void;
}

export function useEchoDeepLink({ onSeek }: UseEchoDeepLinkOptions = {}) {
  const { search, hash } = useLocation();

  useEffect(() => {
    // Handle time param for video seeking
    const qs = new URLSearchParams(search);
    const t = qs.get('t');
    if (t && onSeek) {
      onSeek(Number(t));
    }

    // Handle hash anchors for scrolling
    const targetId = hash.startsWith('#') ? hash.slice(1) : null;
    if (!targetId) return;

    // Scroll to comment
    if (targetId.startsWith('comment=')) {
      const id = targetId.split('=')[1];
      setTimeout(() => {
        document.querySelector(`[data-comment-id="${id}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
    
    // Scroll to message
    else if (targetId.startsWith('msg=')) {
      const id = targetId.split('=')[1];
      setTimeout(() => {
        document.querySelector(`[data-msg-id="${id}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [search, hash, onSeek]);
}
