/** One storage-safe preference across course tabs. No member data or new reads. */
import { useEffect, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
export type CourseListView = 'cards' | 'list';
export const COURSE_LIST_VIEW_KEY = 'courses-list-view';
const EVENT = 'courses-list-view-change';
export function readCourseListView(): CourseListView {
  try { return localStorage.getItem(COURSE_LIST_VIEW_KEY) === 'list' ? 'list' : 'cards'; }
  catch { return 'cards'; }
}
export function useCourseListView(surface: 'courses' | 'top100') {
  const [view, setView] = useState<CourseListView>(readCourseListView);
  useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof CustomEvent && (event.detail === 'cards' || event.detail === 'list')) setView(event.detail);
      else setView(readCourseListView());
    };
    window.addEventListener(EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const changeView = (to: CourseListView) => {
    if (view === to) return;
    let next = to;
    try { localStorage.setItem(COURSE_LIST_VIEW_KEY, to); } catch { next = 'cards'; }
    setView(next); window.dispatchEvent(new CustomEvent(EVENT, { detail:next }));
    if (view !== next) analyticsEvents.track('courses_view_changed', { from: view, to: next, surface });
  };
  return { view, changeView };
}
