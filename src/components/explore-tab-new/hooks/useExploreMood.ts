import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const EXPLORE_MOODS = [
  { id: 'foryou', label: 'For You', emoji: '✨' },
  { id: 'weekend', label: 'Near me', emoji: '📍' },
  { id: 'friends', label: 'Friends Played', emoji: '👥' },
  { id: 'hidden', label: 'Hidden Gems', emoji: '💎' },
  { id: 'bucket', label: 'Bucket List', emoji: '🏆' },
] as const;

export type ExploreMoodId = typeof EXPLORE_MOODS[number]['id'];

const VALID_IDS = EXPLORE_MOODS.map(m => m.id) as readonly string[];
const DEFAULT_MOOD: ExploreMoodId = 'foryou';

/**
 * Reads/writes the active mood from the URL (?mood=...) so that
 * refresh and deep-link preserve state. Falls back to 'foryou'.
 */
export function useExploreMood() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mood');
  const mood: ExploreMoodId = (raw && VALID_IDS.includes(raw) ? raw : DEFAULT_MOOD) as ExploreMoodId;

  const setMood = useCallback((next: ExploreMoodId) => {
    const newParams = new URLSearchParams(params);
    if (next === DEFAULT_MOOD) {
      newParams.delete('mood');
    } else {
      newParams.set('mood', next);
    }
    setParams(newParams, { replace: false });
  }, [params, setParams]);

  return { mood, setMood };
}
