/**
 * WS2 §3 — FILMED AT YOUR COURSES (signed-off watch-s2 mock A). Videos at courses
 * the viewer has played or rated, newest first, from get_watch_course_videos(12).
 * Hidden, heading included, under two rows or on error. Tap opens the canonical
 * viewer on the tile with this shelf's list. See all → /watch/courses.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseVideos } from './useWatchMiddle';
import { showsCourseShelf, whoLine } from './watchMiddle';
import { openVideoList } from './openVideoList';

let viewedThisSession = false;
/** Test hook: reset the once-per-session flag. */
export function __resetCourseShelfViewed() { viewedThisSession = false; }

export const shelfRow: React.CSSProperties = {
  display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none',
  overscrollBehaviorX: 'contain', touchAction: 'pan-x pan-y', willChange: 'transform',
};

export function ShelfHeading({ title, sub, seeAll, onSeeAll }: { title: string; sub?: string; seeAll?: string; onSeeAll?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '28px 16px 10px' }}>
      <div>
        <b style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>{title}</b>
        {sub ? <span style={{ display: 'block', fontSize: 12.5, color: A.DIM, marginTop: 2 }}>{sub}</span> : null}
      </div>
      {onSeeAll ? (
        <button type="button" onClick={onSeeAll} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: A.MUTE }}>
          {seeAll}
        </button>
      ) : null}
    </div>
  );
}

export function DurationChip({ seconds, top, right, size }: { seconds: number | null | undefined; top: number; right: number; size: number }) {
  if (!seconds) return null;
  return (
    <span data-duration style={{ position: 'absolute', top, right, zIndex: 1, background: 'rgba(0,0,0,0.62)', borderRadius: 6, padding: '2px 6px', fontSize: size, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: A.INK }}>
      {formatDuration(seconds)}
    </span>
  );
}

export function CourseVideosShelf({ userId, onDepart }: { userId: string | null | undefined; onDepart?: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const q = useCourseVideos(userId);
  const rows = q.data ?? [];
  const ref = useRef<HTMLDivElement | null>(null);
  const shown = !!userId && !q.isError && showsCourseShelf(rows.length);

  useEffect(() => {
    const el = ref.current;
    if (!shown || !el || viewedThisSession || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !viewedThisSession) {
        viewedThisSession = true;
        analyticsEvents.track('watch_course_shelf_viewed', { count: rows.length });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rows.length]);

  const title = t('amateur.watch.courseShelf.title', 'Filmed at your courses');
  const sub = t('amateur.watch.courseShelf.sub', "Courses you've played or rated");

  if (!userId || q.isError) return null;
  if (q.isLoading) {
    return (
      <div data-course-shelf="loading">
        <ShelfHeading title={title} sub={sub} />
        <div style={shelfRow}>
          {[0, 1].map((i) => <div key={i} style={{ flex: 'none', width: 156, height: 220, borderRadius: 14, background: A.PANEL }} />)}
        </div>
      </div>
    );
  }
  if (!shown) return null;

  return (
    <div data-course-shelf="ready" ref={ref}>
      <ShelfHeading title={title} sub={sub} seeAll={t('amateur.watch.seeAll', 'See all')} onSeeAll={() => navigate('/watch/courses')} />
      <div data-course-shelf-rail style={shelfRow}>
        {rows.map((row, i) => (
          <button
            key={row.post_id}
            type="button"
            data-course-tile={row.post_id}
            onClick={() => { onDepart?.(); openVideoList(rows, i); }}
            style={{ flex: 'none', width: 156, height: 220, borderRadius: 14, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, color: A.INK }}
          >
            {row.poster_url || row.media_url ? (
              row.poster_url
                ? <img src={row.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <video src={`${row.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
            <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.82))' }} />
            <DurationChip seconds={row.duration_seconds} top={8} right={8} size={11.5} />
            <span style={{ position: 'absolute', left: 10, right: 10, bottom: 10, zIndex: 1 }}>
              <span data-course-name style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} aria-hidden />
                {shortCourseName(row.course_name ?? '')}
              </span>
              <span data-course-who style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'rgba(248,250,252,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {whoLine(row)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CourseVideosShelf;
