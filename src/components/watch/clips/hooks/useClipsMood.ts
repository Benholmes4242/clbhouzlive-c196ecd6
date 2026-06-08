import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Zap, Users, MapPin, Flame, type LucideIcon } from 'lucide-react';

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
export const CLIPS_MOODS: ReadonlyArray<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'for_you', label: 'For you', icon: Sparkles },
  { id: 'lightning', label: 'Lightning', icon: Zap },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'your_courses', label: 'From your courses', icon: MapPin },
  { id: 'trending', label: 'Trending', icon: Flame },
] as const;

export type ClipsMoodId = typeof CLIPS_MOODS[number]['id'];

/** Map clips mood → underlying watch-feed filter for the More-to-explore grid. */
export function clipsMoodToWatchMood(mood: ClipsMoodId):
  'all' | 'trending' | 'follows' | 'played_courses' | undefined {
  switch (mood) {
    case 'friends':       return 'follows';
    case 'your_courses':  return 'played_courses';
    case 'trending':      return 'trending';
    case 'lightning':     return 'trending';
    default:              return undefined; // for_you → default trending
  }
}

/** Human label for the active clips mood (null = default "More to explore"). */
export function clipsMoodLabel(mood: ClipsMoodId): string | null {
  switch (mood) {
    case 'lightning':    return 'Lightning round';
    case 'friends':      return 'From people you follow';
    case 'your_courses': return 'From your courses';
    case 'trending':     return 'Trending';
    default:             return null;
  }
}

export function clipsMoodSub(mood: ClipsMoodId): string | null {
  switch (mood) {
    case 'lightning':    return 'Short, fast clips';
    case 'friends':      return 'Clips from your follows';
    case 'your_courses': return "Clips at courses you've played";
    case 'trending':     return "What's hot right now";
    default:             return null;
  }
}

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
