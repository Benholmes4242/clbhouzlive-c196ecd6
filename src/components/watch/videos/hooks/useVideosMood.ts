import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Videos-specific mood filter. Five chips: For you (default) / Course vlogs /
 * Coaching / Tournaments / Friends. Persisted via `?mood=X` so refresh and
 * deep-link preserve state. Default is never written to the URL.
 *
 * Distinct from `useClipsMood` and `useWatchMood` — each Pro Shop surface
 * owns its own URL contract because the chip vocabularies differ.
 *
 * The three category moods (course_vlogs / coaching / tournaments) map to
 * MOMENT_CATEGORY ids that exist on `posts.categories`:
 *   course_vlogs → 'course-vlog'
 *   coaching     → 'tips-coaching'
 *   tournaments  → 'tournament'
 */
export const VIDEOS_MOODS = [
  { id: 'for_you',      label: 'For you',      emoji: '✨' },
  { id: 'course_vlogs', label: 'Course vlogs', emoji: '🎬' },
  { id: 'coaching',     label: 'Coaching',     emoji: '🎓' },
  { id: 'tournaments',  label: 'Tournaments',  emoji: '🏆' },
  { id: 'friends',      label: 'Friends',      emoji: '👥' },
] as const;

export type VideosMoodId = typeof VIDEOS_MOODS[number]['id'];

/** Map mood → MOMENT_CATEGORIES id (when a category mapping exists). */
export function moodToCategory(mood: VideosMoodId): string | null {
  switch (mood) {
    case 'course_vlogs': return 'course-vlog';
    case 'coaching':     return 'tips-coaching';
    case 'tournaments':  return 'tournament';
    default:             return null;
  }
}

/** Human label for the active category mood. */
export function moodCategoryLabel(mood: VideosMoodId): string | null {
  switch (mood) {
    case 'course_vlogs': return 'Course vlogs';
    case 'coaching':     return 'Coaching';
    case 'tournaments':  return 'Tournaments';
    default:             return null;
  }
}

export function moodCategorySub(mood: VideosMoodId): string | null {
  switch (mood) {
    case 'course_vlogs': return 'Course tours and player perspectives';
    case 'coaching':     return 'Drills, swing thoughts, course management';
    case 'tournaments':  return 'Pro tour recaps, highlights, analysis';
    default:             return null;
  }
}

const VALID_IDS = VIDEOS_MOODS.map((m) => m.id) as readonly string[];
const DEFAULT_MOOD: VideosMoodId = 'for_you';

export function useVideosMood() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('mood');
  const mood: VideosMoodId =
    raw && VALID_IDS.includes(raw) ? (raw as VideosMoodId) : DEFAULT_MOOD;

  const setMood = useCallback(
    (next: VideosMoodId) => {
      const newParams = new URLSearchParams(params);
      if (next === DEFAULT_MOOD) {
        newParams.delete('mood');
      } else {
        newParams.set('mood', next);
      }
      setParams(newParams, { replace: false });
    },
    [params, setParams],
  );

  return { mood, setMood };
}
