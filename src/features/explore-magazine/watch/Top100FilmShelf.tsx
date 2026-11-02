/**
 * WS3 §3 — TOP 100 ON FILM (signed-off watch-s3 mock A). Videos at courses on
 * any Top 100 list, newest first, from get_watch_top100_videos(12); each tile
 * carries the course's best rank. Shows with three or more rows, hides quietly
 * otherwise or on error. See all → /watch/top100. Tiles match the WS2 course
 * tiles plus a top gradient, rank pill and top-right duration; no pin icon.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { DurationChip, ShelfHeading, shelfRow } from './CourseVideosShelf';
import { useTop100Videos } from './useWatchBottom';
import { rankPill, showsTop100Shelf } from './watchBottom';
import { whoLine, type WatchVideoRow } from './watchMiddle';
import { openVideoList } from './openVideoList';

let viewedThisSession = false;
/** Test hook. */
export function __resetTop100Viewed() { viewedThisSession = false; }

export function Top100FilmShelf({ userId, onDepart }: { userId: string | null | undefined; onDepart?: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const q = useTop100Videos(userId);
  const rows = q.data ?? [];
  const ref = useRef<HTMLDivElement | null>(null);
  const shown = !!userId && !q.isError && showsTop100Shelf(rows.length);

  useEffect(() => {
    const el = ref.current;
    if (!shown || !el || viewedThisSession || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !viewedThisSession) {
        viewedThisSession = true;
        analyticsEvents.track('watch_top100_viewed');
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  if (!shown) return null;

  return (
    <div data-top100-shelf ref={ref}>
      <ShelfHeading
        title={t('amateur.watch.top100.title', 'Top 100 on film')}
        sub={t('amateur.watch.top100.sub', 'The lists, filmed by members')}
        seeAll={t('amateur.watch.seeAll', 'See all')}
        onSeeAll={() => navigate('/watch/top100')}
      />
      <div style={shelfRow}>
        {rows.map((row, i) => (
          <button
            key={row.post_id}
            type="button"
            data-top100-tile={row.post_id}
            onClick={() => {
              analyticsEvents.track('watch_top100_opened', { list_slug: row.list_slug });
              onDepart?.();
              openVideoList(rows as unknown as WatchVideoRow[], i);
            }}
            style={{ flex: 'none', width: 156, height: 220, borderRadius: 14, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, color: A.INK }}
          >
            {row.poster_url ? <img src={row.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.82))' }} />
            <span data-top100-rank style={{ position: 'absolute', left: 8, top: 8, zIndex: 1, height: 22, padding: '0 8px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {rankPill(row)}
            </span>
            <DurationChip seconds={row.duration_seconds} top={8} right={8} size={11.5} />
            <span style={{ position: 'absolute', left: 10, right: 10, bottom: 10, zIndex: 1 }}>
              <span data-top100-course style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                {shortCourseName(row.course_name ?? '')}
              </span>
              <span data-top100-who style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'rgba(248,250,252,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {whoLine(row)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Top100FilmShelf;
