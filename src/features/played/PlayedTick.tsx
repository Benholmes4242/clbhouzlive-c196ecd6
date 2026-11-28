/** Brief 50 Part B (Ben's ruling) — opt-in played tick for BrowseCourseCard and
 * CourseListRow on the Courses and Top 100 lists only. The tick is a SIBLING of
 * the card's button (never nested), so tapping it never opens the course. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayedCourses } from '@/hooks/played/usePlayedCourses';
import { useSetCoursePlayed } from '@/hooks/played/useSetCoursePlayed';
import { isPlayed, viewerPill, youLine, type TickSource } from '@/hooks/played/playedRules';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CheckIcon } from './PlayedIcons';
import './played.css';

export type PlayedTickSource = Extract<TickSource, 'courses_list' | 'top100_list'>;

export function usePlayedTick(courseId: string, source: PlayedTickSource | undefined) {
  const played = usePlayedCourses();
  const { toggle } = useSetCoursePlayed();
  const on = Boolean(source) && Boolean(played.userId);
  const entry = played.get(courseId);
  return { on, entry, source, pill: on ? viewerPill(entry) : null, toggle };
}
export type Tick = ReturnType<typeof usePlayedTick>;

/** No opt-in: no hooks, no tick, no pill. */
export const OFF_TICK: Tick = { on: false, entry: undefined, source: undefined, pill: null, toggle: () => false };

/** Mounts the played hooks only for opted-in cards (Ben ruling, Brief 50). */
export function WithPlayedTick({ courseId, source, render }: { courseId: string; source: PlayedTickSource; render: (tick: Tick) => React.ReactElement }) {
  return render(usePlayedTick(courseId, source));
}

export function PlayedPill({ status }: { status: 'rated' | 'played' | null }) {
  if (!status) return null;
  return <span className="pl-vp" data-viewer-pill={status}>{status === 'rated' ? 'RATED' : 'PLAYED'}</span>;
}

export function PlayedTickButton({ courseId, name, variant, tick }: { courseId: string; name: string; variant: 'card' | 'row'; tick: Tick }) {
  if (!tick.on || !tick.source) return null;
  const active = isPlayed(tick.entry);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    tick.toggle(tick.entry, courseId, name, tick.source!);
  };
  return variant === 'card'
    ? <button type="button" className="pl-tk" data-on={active} aria-pressed={active} aria-label={active ? `${name} played` : `Mark ${name} as played`} onClick={onClick}>
        <span><CheckIcon size={16} /></span>
      </button>
    : <button type="button" className="pl-rtk" aria-pressed={active} aria-label={active ? `${name} played` : `Mark ${name} as played`} onClick={onClick}>
        <span className="pl-cb" data-on={active}><CheckIcon size={14} /></span>
      </button>;
}

export function PlayedYouLine({ courseId, tick }: { courseId: string; tick: Tick }) {
  const navigate = useNavigate();
  if (!tick.on) return null;
  const line = youLine(tick.entry);
  if (!line) return null;
  if (line.kind === 'rated') return <div className="pl-you" data-you-line="rated"><span>You rated it <span className="sc">{line.rating}</span></span></div>;
  return <div className="pl-you" data-you-line="unrated"><span>{line.text}</span>
    <button type="button" onClick={(e) => { e.stopPropagation(); analyticsEvents.track('played_rate_tap', { course_id: courseId, source: tick.source }); navigate(`/courses/${courseId}/rate`); }}>Rate it ›</button>
  </div>;
}
