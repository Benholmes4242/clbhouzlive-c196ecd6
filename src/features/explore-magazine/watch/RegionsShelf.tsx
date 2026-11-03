/**
 * WS2 §4 — BY REGION (signed-off watch-s2 mock A). Regions with 3+ videos from
 * get_watch_regions, home region first. Shown only with three or more regions;
 * hidden quietly otherwise or on error. Tap → /watch/region/{region}.
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useWatchRegions } from './useWatchMiddle';
import { regionPath, showsRegionsShelf, videosLabel } from './watchMiddle';
import { ShelfHeading, shelfRow } from './CourseVideosShelf';

export function RegionsShelf({ userId }: { userId: string | null | undefined }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const q = useWatchRegions(userId);
  const rows = q.data ?? [];
  if (!userId || q.isError || !showsRegionsShelf(rows.length)) return null;

  return (
    <div data-regions-shelf>
      <ShelfHeading title={t('amateur.watch.regions.title', 'By region')} sub={t('amateur.watch.regions.sub', 'Where the videos were filmed')} />
      <div data-regions-rail style={shelfRow}>
        {rows.map((r) => (
          <button
            key={r.region}
            type="button"
            data-region-tile={r.region}
            onClick={() => {
              analyticsEvents.track('watch_region_tapped', { region: r.region, is_home: !!r.is_home });
              navigate(regionPath(r.region));
            }}
            style={{ flex: 'none', width: 156, height: 100, borderRadius: 14, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, color: A.INK }}
          >
            {r.poster_url ? <img src={r.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.75))' }} />
            {r.is_home ? (
              <span data-your-patch style={{ position: 'absolute', left: 10, top: 9, zIndex: 1, height: 22, padding: '0 8px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                {t('amateur.watch.regions.yourPatch', 'Your patch')}
              </span>
            ) : null}
            <b style={{ position: 'absolute', left: 12, bottom: 25, zIndex: 1, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{r.region}</b>
            <span data-region-count style={{ position: 'absolute', left: 12, bottom: 9, zIndex: 1, fontSize: 11.5, color: 'rgba(248,250,252,0.78)', fontVariantNumeric: 'tabular-nums' }}>
              {videosLabel(Number(r.videos))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RegionsShelf;
