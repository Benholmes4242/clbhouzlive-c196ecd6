/**
 * WS2 §5 — THE WATCH GRID PAGES (signed-off watch-s2 mock B).
 *   /watch/region/:region  every video filmed in a region, chips per course
 *   /watch/courses         videos at the viewer's courses, no chips
 *   /watch/top100          WS3 — Top 100 on film, no sub, no chips
 * G2D: global islands own history back and PageTitle owns the observed h1.
 * Only regions mount IslandDock; both chip copies share selection/analytics.
 * 3-column grid, 30 per page,
 * keyset on the last created_at, one sentinel. Tap opens the canonical viewer on
 * the tile with the loaded list (the viewer has no live append, so swipe stays
 * within what is loaded). Guests meet the app gate like /rounds.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useGridVideos, useRegionCourses, useWatchRegions, type GridSource } from '@/features/explore-magazine/watch/useWatchMiddle';
import { coursesLabel, videosLabel } from '@/features/explore-magazine/watch/watchMiddle';
import { DurationChip } from '@/features/explore-magazine/watch/CourseVideosShelf';
import { openVideoList } from '@/features/explore-magazine/watch/openVideoList';
import { PageTitle } from '@/features/chrome-v2/PageTitle';
import { IslandDock } from '@/features/chrome-v2/IslandDock';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';

export default function WatchGridPage({ kind }: { kind: 'region' | 'courses' | 'top100' }) {
  const { t } = useTranslation('courses');
  const params = useParams<{ region: string }>();
  const region = kind === 'region' ? params.region ?? '' : null;
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;
  const [courseId, setCourseId] = useState<string | null>(null);

  const regions = useWatchRegions(kind === 'region' ? userId : null);
  const courses = useRegionCourses(userId, region);
  const meta = region ? (regions.data ?? []).find((r) => r.region === region) : undefined;

  const src: GridSource = useMemo(() => (kind === 'courses' ? { kind: 'courses' } : kind === 'top100' ? { kind: 'top100' } : { kind: 'region', region: region ?? '', courseId }), [kind, region, courseId]);
  const grid = useGridVideos(userId, src);
  const rows = useMemo(() => (grid.data?.pages ?? []).flat(), [grid.data]);

  useEffect(() => { analyticsEvents.track('watch_grid_viewed', { kind }); }, [kind]);

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

  const title = kind === 'courses' ? t('amateur.watch.grid.yourCourses', 'Your courses') : kind === 'top100' ? t('amateur.watch.top100.title', 'Top 100 on film') : region;
  const sub = kind === 'region' && meta ? `${videosLabel(Number(meta.videos))} \u00b7 ${coursesLabel(Number(meta.courses))}` : null;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  useIslandBackName(title ?? '', titleRef);

  const chip = (id: string | null, label: string, docked = false) => {
    const on = courseId === id;
    return (
      <button
        key={id ?? 'all'}
        type="button"
        data-grid-chip={docked ? undefined : id ?? 'all'}
        data-grid-dock-chip={docked ? id ?? 'all' : undefined}
        role={docked ? 'tab' : undefined}
        aria-selected={docked ? on : undefined}
        aria-pressed={on}
        onClick={() => {
          if (on) return;
          analyticsEvents.track('watch_grid_chip', { region, course_id: id });
          setCourseId(id);
        }}
        style={docked ? { flex: 'none', whiteSpace: 'nowrap', height: 34, padding: '0 13px', borderRadius: 13, border: '1px solid var(--island-back-edge)', color: on ? 'var(--island-back-ink)' : A.MUTE, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' } : { flex: 'none', whiteSpace: 'nowrap', height: 32, padding: '0 13px', borderRadius: 999, border: `1px solid ${on ? A.INK : 'rgba(255,255,255,0.14)'}`, background: on ? A.INK : 'transparent', color: on ? '#0B0B0D' : A.MUTE, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div data-watch-grid-page={kind} style={{ background: A.CANVAS, minHeight: '100dvh', paddingTop: CHROME_CLEARANCE, fontFamily: SANS, color: A.INK }}>
      <PageTitle ref={titleRef} title={title ?? ''} subtitle={sub ?? undefined} />

      {kind === 'region' ? (
        <>
        <div ref={chipsRef} data-grid-chips style={{ display: 'flex', gap: 8, padding: '14px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}>
          {chip(null, t('amateur.watch.grid.all', 'All'))}
          {(courses.data ?? []).map((c) => chip(c.course_id, shortCourseName(c.course_name ?? '')))}
        </div>
        <IslandDock anchorRef={chipsRef}>{() => <div role="tablist" aria-label={t('amateur.watch.grid.yourCourses', 'Your courses')} data-grid-dock-chips style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', overscrollBehaviorX: 'contain', willChange: 'transform' }}>
          {chip(null, t('amateur.watch.grid.all', 'All'), true)}
          {(courses.data ?? []).map((c) => chip(c.course_id, shortCourseName(c.course_name ?? ''), true))}
        </div>}</IslandDock>
        </>
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
export function WatchTop100Page() { return <WatchGridPage kind="top100" />; }
