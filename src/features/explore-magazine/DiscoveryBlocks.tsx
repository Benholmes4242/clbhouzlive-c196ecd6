import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';
import { PHOTO_REVIEW_LABEL } from '@/styles/photoScrim';

import { SHELF_HEADING } from './ExploreShelf';
import type { NationActivityRow, RegionActivityRow } from './useDiscoveryCounts';

/**
 * §C REGION GRID AND NATION LIST (BRIEF_COURSES_DISCOVERY). UI only — the
 * counts come from useDiscoveryCounts, a typed stub until the hand-run function
 * lands. No rows = no block.
 */

/** Same shadow the other on-photo labels use (CoursesPlayedSection). */
const ON_PHOTO_SHADOW = '0 1px 2px rgba(0,0,0,0.72)';

/** The fact that sends you somewhere: what is left to play. */
const TILE_META_PRIMARY: CSSProperties = {
  marginTop: 2,
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.3,
  color: A.INK,
  textShadow: ON_PHOTO_SHADOW,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  ...NUMF,
};

/** The fact you already know: your own history, one tier quieter.
 *  0.07em tracking is deliberate: mostly digits, 193px column. */
const TILE_META_QUIET: CSSProperties = {
  marginTop: 2,
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1.3,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: PHOTO_REVIEW_LABEL,
  textShadow: ON_PHOTO_SHADOW,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  ...NUMF,
};

/**
 * LOCAL EXCEPTION TO SCRIM_STANDOUT (BRIEF_REGION_TILE_TWO_LINE_FOOT §3).
 * The canonical gradient goes transparent at 32%; this tile's foot is now
 * three lines tall and reaches 56% of its 104px, so the region name would sit
 * on bare photograph. Same colour and the same construction — only the
 * termination moves, and only for this tile.
 */
const REGION_TILE_SCRIM = 'linear-gradient(0deg, rgba(10,14,10,0.86) 0%, rgba(10,14,10,0) 56%)';

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
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: REGION_TILE_SCRIM }} />
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 9 }}>
              <div
                style={{
                  fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: A.INK,
                  textShadow: ON_PHOTO_SHADOW, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {row.region}
              </div>
              {row.played === 0 ? (
                <div style={TILE_META_PRIMARY}>
                  {t('amateur.discovery.activeCourses', '{{count}} courses', { count: row.active })}
                </div>
              ) : row.played >= row.active ? (
                <div style={TILE_META_PRIMARY}>
                  {t('amateur.discovery.playedAll', "You've played all {{count}}", { count: row.active })}
                </div>
              ) : (
                <>
                  <div style={TILE_META_PRIMARY}>
                    {t('amateur.discovery.toDiscover', '{{count}} to discover', { count: row.toDiscover })}
                  </div>
                  <div style={TILE_META_QUIET}>
                    {t('amateur.discovery.playedOf', 'played {{played}} of {{active}}', { played: row.played, active: row.active })}
                  </div>
                </>
              )}
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
