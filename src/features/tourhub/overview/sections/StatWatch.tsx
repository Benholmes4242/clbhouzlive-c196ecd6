/**
 * StatWatch — stat picker above ONE list of five season leaders.
 *
 * Replaces the 218px horizontal card rail, which clipped its second card
 * mid-figure and gave chasers names with no values. There is no horizontal
 * card scroll here: the only scrolling element is the picker, and it is the
 * canonical PillFilterRow used by Discover, Courses and Champions.
 *
 * The deviation bar under each name is the point of the section: strokes
 * gained IS a deviation, so the bar is not decoration laid over the number —
 * it is the number. Absolute stats (scoring average, driving distance) have no
 * natural zero and anchor on the measured season field average instead, and
 * the micro-label says so. See useStatWatch's `anchor`.
 *
 * PGA-only today (see useStatWatch coverage). Self-hides otherwise.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { useStatWatch, type StatCategory, type StatKey } from '../data/useStatWatch';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourId } from '../../hooks/useOverviewData';
import { PillFilterRow } from '@/components/explore-tab-new/courseled/PillFilterRow';
import { Skeleton } from '@/components/ui/skeleton';

/** Bar geometry — the fill never touches the track end (1.12 headroom). */
const BAR_HEIGHT = 5;
const BAR_HEADROOM = 1.12;

export function StatWatch({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data, isLoading } = useStatWatch(tour);
  const categories = data?.categories ?? [];
  const [selected, setSelected] = useState<StatKey | null>(null);

  const active: StatCategory | undefined = useMemo(
    () => categories.find((c) => c.key === selected) ?? categories[0],
    [categories, selected],
  );

  if (isLoading && categories.length === 0) {
    return (
      <SectionShell
        eyebrow={t('overview.statWatch.eyebrow')}
        linkLabel={t('overview.statWatch.allStatsLink')}
        onLinkClick={() => navigate('/tourhub?tab=leaderboards')}
      >
        <div style={{ padding: '0 16px 6px' }}>
          <Skeleton className="h-3 w-40 rounded" />
        </div>
        {/* Models the NEW shape: a picker row, then five list rows with a bar. */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px 0', overflow: 'hidden' }}>
          {[92, 118, 128, 122].map((w, i) => (
            <Skeleton key={i} className="h-[34px] rounded-full" style={{ width: w, flex: 'none' }} />
          ))}
        </div>
        <div style={{ padding: '10px 16px 0' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: i === 0 ? 62 : 54 }}>
              <Skeleton className="h-3 w-3.5 rounded" />
              {i === 0 ? <Skeleton className="h-[30px] w-[30px]" style={{ borderRadius: 11 }} /> : null}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton className="h-3.5 w-2/5 rounded" />
                <Skeleton className="rounded" style={{ height: BAR_HEIGHT, width: `${70 - i * 12}%` }} />
              </div>
              <Skeleton className="h-4 w-10 rounded" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }
  if (categories.length === 0 || !active) return null;

  return (
    <SectionShell
      eyebrow={t('overview.statWatch.eyebrow')}
      linkLabel={t('overview.statWatch.allStatsLink')}
      onLinkClick={() => navigate('/tourhub?tab=leaderboards')}
    >
      <div style={{ padding: '0 16px 6px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
        {/* NEVER-KEY interpolation: TOUR_LABEL/tour is a data token (proper noun). */}
        {t('overview.statWatch.seasonLeaders', { tourLabel: TOUR_LABEL[tour] ?? tour.toUpperCase() })}
      </div>

      {/* Canonical pill row — same primitive as Discover / Courses / Champions. */}
      <PillFilterRow<StatKey>
        value={active.key}
        options={categories.map((c) => ({ value: c.key, label: c.label }))}
        onChange={setSelected}
        ariaLabel={t('overview.statWatch.pickerAriaLabel', 'Choose a statistic')}
        style={{ padding: '2px 16px 0' }}
      />

      <StatList category={active} tour={tour} onNavigate={(id) => navigate(`/tourhub/player/${id}`)} />
    </SectionShell>
  );
}

function StatList({
  category,
  tour,
  onNavigate,
}: {
  category: StatCategory;
  tour: TourId;
  onNavigate: (playerId: string) => void;
}) {
  const { t } = useTranslation('tourhub');
  const leaders = category.leaders;
  const maxAbs = Math.max(...leaders.map((l) => Math.abs(l.deviation)), 0.0001);
  const direction =
    category.order === 'desc'
      ? t('overview.statWatch.higherIsBetter', 'Higher is better')
      : t('overview.statWatch.lowerIsBetter', 'Lower is better');
  // Absolute stats say what the bar is measured against; SG stats do not need
  // to, because their zero IS the field.
  const anchorNote =
    category.anchor === 'fieldAverage' && category.fieldAverage != null
      ? t('overview.statWatch.vsFieldAvg', 'vs field avg {{value}}', {
          value: category.format(category.fieldAverage),
        })
      : null;

  return (
    <div style={{ padding: '10px 16px 0' }}>
      {/* READ floor 11. */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: V4.inkFaint,
        }}
      >
        {[category.unit, direction, anchorNote].filter(Boolean).join(' · ')}
      </div>

      <div style={{ marginTop: 8 }}>
        {leaders.map((l, i) => {
          const isLeader = i === 0;
          const width = `${(Math.abs(l.deviation) / (maxAbs * BAR_HEADROOM)) * 100}%`;
          return (
            <div
              key={l.playerId}
              role="link"
              onClick={() => onNavigate(l.playerId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: isLeader ? '10px 10px' : '10px 10px',
                margin: isLeader ? '0 -10px' : '0 -10px',
                background: isLeader ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderRadius: isLeader ? 12 : 0,
                cursor: 'pointer',
              }}
            >
              {/* Position numbers stay at 13 — the floor is a minimum, not a target. */}
              <div
                style={{
                  width: 14,
                  flex: 'none',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isLeader ? V4.ink : V4.inkFaint,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {i + 1}
              </div>
              {isLeader ? (
                <PlayerAvatar
                  playerId={l.playerId}
                  playerName={l.playerName}
                  tourCode={tour}
                  photoUrl={l.photoUrl ?? l.headshotOverride}
                  size="sm"
                  className="!w-[30px] !h-[30px]"
                />
              ) : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: isLeader ? 700 : 600,
                    color: V4.ink,
                    letterSpacing: '-0.005em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {l.playerName}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: BAR_HEIGHT,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width,
                      height: '100%',
                      borderRadius: 3,
                      background: isLeader ? 'rgba(248,250,252,0.82)' : 'rgba(248,250,252,0.44)',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  flex: 'none',
                  textAlign: 'right',
                  fontSize: isLeader ? 18 : 15,
                  fontWeight: 700,
                  color: V4.ink,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {category.format(l.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatWatch;
