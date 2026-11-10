/**
 * review_text_cleared — fires once each time the review text goes from
 * non-empty to empty on the words step. Carries lengths only, never text.
 * after_voice = a dictation was appended earlier in this wizard session.
 */
import { useCallback, useEffect, useRef } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function useTextClearedTracking(text: string, onWordsStep: boolean) {
  const dictatedRef = useRef(false);
  const prevLenRef = useRef(text.length);
  useEffect(() => {
    const len = text.length;
    if (onWordsStep && prevLenRef.current > 0 && len === 0) {
      analyticsEvents.track('review_text_cleared', { from_len: prevLenRef.current, after_voice: dictatedRef.current });
    }
    prevLenRef.current = len;
  }, [text, onWordsStep]);
  return useCallback(() => { dictatedRef.current = true; }, []);
}
