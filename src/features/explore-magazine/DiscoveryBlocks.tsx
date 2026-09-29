import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

import { SHELF_HEADING } from './ExploreShelf';
import type { NationActivityRow, RegionActivityRow } from './useDiscoveryCounts';

/**
 * §C REGION GRID AND NATION LIST (BRIEF_COURSES_DISCOVERY). UI only — the
 * counts come from useDiscoveryCounts, a typed stub until the hand-run function
 * lands. No rows = no block.
 */

/** Same shadow the other on-photo labels use (CoursesPlayedSection). */
const ON_PHOTO_SHADOW = '0 1px 2px rgba(0,0,0,0.72)';

function Heading({ children }: { children: string }) {
  return <div style={{ ...SHELF_HEADING, padding: '0 16px', marginBottom: 10 }}>{children}</div>;
}

export function RegionGrid({ rows, onPress }: { rows: RegionActivityRow[] | null; onPress: (row: RegionActivityRow) => void }) {
  const { t } = useTranslation('courses');
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ fontFamily: SANS }}>
      <Heading>{t('amateur.discovery.regionsHeading', 'Where members are playing')}</Heading>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, padding: '0 12px' }}>
        {rows.map((row) => (
          <button
            key={row.region}
            type="button"
            onClick={() => onPress(row)}
            style={{ all: 'unset', position: 'relative', height: 104, borderRadius: r.md, overflow: 'hidden', background: A.PANEL, cursor: 'pointer' }}
          >
            {row.imageUrl ? (
              <img src={row.imageUrl} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <CourseImageFallback />
            )}
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 9 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: A.INK, textShadow: ON_PHOTO_SHADOW, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.region}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: A.INK, textShadow: ON_PHOTO_SHADOW, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...NUMF }}>
                {row.played === 0 ? (
                  t('amateur.discovery.activeCourses', '{{count}} courses', { count: row.active })
                ) : row.played >= row.active ? (
                  t('amateur.discovery.playedAll', "You've played all {{count}}", { count: row.active })
                ) : (
                  <>
                    {t('amateur.discovery.toDiscover', '{{count}} to discover', { count: row.toDiscover })}
                    <span style={{ color: A.MUTE }}>
                      {' \u00B7 '}
                      {t('amateur.discovery.playedOf', 'played {{played}} of {{active}}', { played: row.played, active: row.active })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NationList({ rows, onPress }: { rows: NationActivityRow[] | null; onPress: (row: NationActivityRow) => void }) {
  const { t } = useTranslation('courses');
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ fontFamily: SANS }}>
      <Heading>{t('amateur.discovery.nationsHeading', 'Browse the world')}</Heading>
      <div style={{ padding: '0 16px', marginTop: -6, marginBottom: 10, fontSize: 11.5, fontWeight: 500, color: A.DIM }}>
        {t('amateur.discovery.nationsSub', 'Courses with a round or a rating')}
      </div>
      <div style={{ margin: '0 12px', borderRadius: r.md, background: A.PANEL, overflow: 'hidden' }}>
        {rows.map((row, i) => {
          const empty = row.active === 0;
          const inner = (
            <>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.INK }}>{row.nation}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: A.DIM, ...NUMF }}>
                {empty ? (
                  t('amateur.discovery.nothingYet', 'Nothing yet')
                ) : (
                  <>
                    {row.active === 1
                      ? t('amateur.discovery.oneCourse', '1 course')
                      : t('amateur.discovery.nCourses', '{{n}} courses', { n: row.active.toLocaleString() })}{' \u203A'}
                  </>
                )}
              </span>
            </>
          );
          const rowStyle = {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '13px 14px', borderTop: i === 0 ? 'none' : `0.5px solid ${A.SOFT}`,
          } as const;
          /* ZERO ACTIVE COURSES: greyed, honest, and NOT a link (§C2). */
          return empty ? (
            <div key={row.nation} style={{ ...rowStyle, opacity: 0.45 }}>{inner}</div>
          ) : (
            <button key={row.nation} type="button" onClick={() => onPress(row)} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', ...rowStyle }}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
