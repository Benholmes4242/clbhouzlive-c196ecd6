import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Clips-specific mood filter. Five chips: For you (default) / Lightning /
 * Friends / From your courses / Trending. Persisted via `?mood=X` so refresh
 * and deep-link preserve state. Default is never written to the URL.
 * Uses replace: true so filter toggles don't pollute browser history —
 * tapping back from the subpage returns to the previous page, not through
 * every chip tap.
 *
 * Intentionally separate from `useWatchMood` (Watch tab) — the chip set is
 * different and we want each surface to own its own URL contract.
 */
export const CLIPS_MOODS = [
  { id: 'for_you', label: 'For you', emoji: '✨' },
  { id: 'lightning', label: 'Lightning', emoji: '⚡' },
  { id: 'friends', label: 'Friends', emoji: '👥' },
  { id: 'your_courses', label: 'From your courses', emoji: '📍' },
  { id: 'trending', label: 'Trending', emoji: '🔥' },
] as const;

export type ClipsMoodId = typeof CLIPS_MOODS[number]['id'];

const VALID_IDS = CLIPS_MOODS.map((m) => m.id) as readonly string[];
const DEFAULT_MOOD: ClipsMoodId = 'for_you';

export function useClipsMood() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mood');
  const mood: ClipsMoodId =
    raw && VALID_IDS.includes(raw) ? (raw as ClipsMoodId) : DEFAULT_MOOD;

  const setMood = useCallback(
    (next: ClipsMoodId) => {
      const newParams = new URLSearchParams(params);
      if (next === DEFAULT_MOOD) {
        newParams.delete('mood');
      } else {
        newParams.set('mood', next);
      }
      setParams(newParams, { replace: true });
    },
    [params, setParams],
  );

  return { mood, setMood };
}
