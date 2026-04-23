import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const WATCH_MOODS = [
  { id: 'for_you', label: 'For you', emoji: '✨' },
  { id: 'played_courses', label: 'Courses played', emoji: '⛳' },
  { id: 'follows', label: 'Your follows', emoji: '👥' },
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'tour_week', label: 'Tour week', emoji: '🏆' },
] as const;

export type WatchMoodId = typeof WATCH_MOODS[number]['id'];

const VALID_IDS = WATCH_MOODS.map((m) => m.id) as readonly string[];
const DEFAULT_MOOD: WatchMoodId = 'for_you';

/**
 * Reads/writes the active Watch tab mood from `?mood=` so refresh and
 * deep-link preserve state. Falls back to 'for_you'. Default mood is
 * never written to the URL — keeps URLs clean.
 * Uses replace: true so filter toggles don't pollute browser history —
 * tapping back from the subpage returns to the previous page, not through
 * every chip tap.
 */
export function useWatchMood() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mood');
  const mood: WatchMoodId =
    raw && VALID_IDS.includes(raw) ? (raw as WatchMoodId) : DEFAULT_MOOD;

  const setMood = useCallback(
    (next: WatchMoodId) => {
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
