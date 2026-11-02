/**
 * WS2 §5 — THE WATCH GRID PAGES (signed-off watch-s2 mock B).
 *   /watch/region/:region  every video filmed in a region, chips per course
 *   /watch/courses         videos at the viewer's courses, no chips
 * Chrome 'none', dark; Find people / Rounds header. 3-column grid, 30 per page,
 * keyset on the last created_at, one sentinel. Tap opens the canonical viewer on
 * the tile with the loaded list (the viewer has no live append, so swipe stays
 * within what is loaded). Guests meet the app gate like /rounds.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useGridVideos, useRegionCourses, useWatchRegions, type GridSource } from '@/features/explore-magazine/watch/useWatchMiddle';
import { coursesLabel, videosLabel } from '@/features/explore-magazine/watch/watchMiddle';
import { DurationChip } from '@/features/explore-magazine/watch/CourseVideosShelf';
import { openVideoList } from '@/features/explore-magazine/watch/openVideoList';

export default function WatchGridPage({ kind }: { kind: 'region' | 'courses' }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const params = useParams<{ region: string }>();
  const region = kind === 'region' ? params.region ?? '' : null;
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;
  const [courseId, setCourseId] = useState<string | null>(null);

  const regions = useWatchRegions(kind === 'region' ? userId : null);
  const courses = useRegionCourses(userId, region);
  const meta = region ? (regions.data ?? []).find((r) => r.region === region) : undefined;

  const src: GridSource = useMemo(() => (kind === 'courses' ? { kind: 'courses' } : { kind: 'region', region: region ?? '', courseId }), [kind, region, courseId]);
  const grid = useGridVideos(userId, src);
  const rows = useMemo(() => (grid.data?.pages ?? []).flat(), [grid.data]);

  useEffect(() => { analyticsEvents.track('watch_grid_viewed', { kind }); }, [kind]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/amateur');
  }, [navigate]);

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && grid.hasNextPage && !grid.isFetchingNextPage) void grid.fetchNextPage();
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [grid]);

  const title = kind === 'courses' ? t('amateur.watch.grid.yourCourses', 'Your courses') : region;
  const sub = kind === 'region' && meta ? `${videosLabel(Number(meta.videos))} \u00b7 ${coursesLabel(Number(meta.courses))}` : null;

  const chip = (id: string | null, label: string) => {
    const on = courseId === id;
    return (
      <button
        key={id ?? 'all'}
        type="button"
        data-grid-chip={id ?? 'all'}
        aria-pressed={on}
        onClick={() => {
          if (on) return;
          analyticsEvents.track('watch_grid_chip', { region, course_id: id });
          setCourseId(id);
        }}
        style={{ flex: 'none', whiteSpace: 'nowrap', height: 32, padding: '0 13px', borderRadius: 999, border: `1px solid ${on ? A.INK : 'rgba(255,255,255,0.14)'}`, background: on ? A.INK : 'transparent', color: on ? '#0B0B0D' : A.MUTE, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div data-watch-grid-page={kind} style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS, color: A.INK }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 0', minHeight: 'calc(env(safe-area-inset-top, 0px) + 50px)' }}>
        <button type="button" aria-label="Back" onClick={goBack}
          style={{ width: 36, height: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', background: 'none', color: A.INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', marginRight: 36 }}>
          <b data-grid-title style={{ display: 'block', fontSize: 17, fontWeight: 700 }}>{title}</b>
          {sub ? <span data-grid-sub style={{ display: 'block', fontSize: 12, color: A.DIM, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{sub}</span> : null}
        </div>
      </header>

      {kind === 'region' ? (
        <div data-grid-chips style={{ display: 'flex', gap: 8, padding: '14px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}>
          {chip(null, t('amateur.watch.grid.all', 'All'))}
          {(courses.data ?? []).map((c) => chip(c.course_id, shortCourseName(c.course_name ?? '')))}
        </div>
      ) : <div style={{ height: 14 }} />}

      <main style={{ paddingBottom: NAV_CLEARANCE }}>
        {grid.isSuccess && rows.length === 0 ? (
          <p data-grid-empty style={{ margin: 0, padding: '40px 24px', textAlign: 'center', fontSize: 14, color: A.MUTE }}>
            {t('amateur.watch.grid.empty', 'No videos here yet.')}
          </p>
        ) : (
          <div data-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {rows.map((row, i) => (
              <button key={`${row.post_id}:${i}`} type="button" data-grid-tile={row.post_id}
                onClick={() => { analyticsEvents.track('watch_grid_video_opened', { kind }); openVideoList(rows, i); }}
                style={{ height: 172, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer', color: A.INK, fontFamily: SANS, textAlign: 'left' }}>
                {row.poster_url ? <img src={row.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6))' }} />
                <DurationChip seconds={row.duration_seconds} top={6} right={6} size={10.5} />
                <span data-grid-course style={{ position: 'absolute', left: 6, right: 6, bottom: 6, zIndex: 1, fontSize: 10.5, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shortCourseName(row.course_name ?? '')}
                </span>
              </button>
            ))}
          </div>
        )}
        <div ref={sentinel} aria-hidden style={{ height: 1 }} />
      </main>
    </div>
  );
}

export function WatchRegionPage() { return <WatchGridPage kind="region" />; }
export function WatchCoursesPage() { return <WatchGridPage kind="courses" />; }
