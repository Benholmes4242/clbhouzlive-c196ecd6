/**
 * StatWatch — season-leader rail. 218px cards, one per stat category.
 * PGA-only today (see useStatWatch coverage). Self-hides otherwise.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { useStatWatch, type StatCategory } from '../data/useStatWatch';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourId } from '../../hooks/useOverviewData';
import { Skeleton } from '@/components/ui/skeleton';

export function StatWatch({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data, isLoading } = useStatWatch(tour);
  const categories = data?.categories ?? [];
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
        <div style={{ display: 'flex', gap: 10, overflowX: 'hidden', padding: '10px 16px 10px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: '0 0 218px',
                background: V4.surface,
                border: `0.5px solid ${V4.cardBorder}`,
                boxShadow: V4.cardShadow,
                borderRadius: 16,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <Skeleton className="h-3 w-24 rounded" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton className="h-8 w-8" style={{ borderRadius: 12 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-3.5 w-3/5 rounded" />
                  <Skeleton className="h-3 w-2/5 rounded" />
                </div>
                <Skeleton className="h-5 w-10 rounded" />
              </div>
              <div style={{ height: '0.5px', background: V4.hairline }} />
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }
  if (categories.length === 0) return null;

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
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '10px 16px 10px',
          scrollPaddingLeft: 16,
          scrollSnapType: 'x mandatory',
        }}
      >
        {categories.map((c) => (
          <StatCard key={c.key} category={c} tour={tour} onNavigate={(id) => navigate(`/tourhub/player/${id}`)} />
        ))}
      </div>
    </SectionShell>
  );
}

function StatCard({
  category,
  tour,
  onNavigate,
}: {
  category: StatCategory;
  tour: TourId;
  onNavigate: (playerId: string) => void;
}) {
  const [leader, ...chasers] = category.leaders;
  const tourCode = tour;
  return (
    <div
      style={{
        flex: '0 0 218px',
        scrollSnapAlign: 'start',
        background: V4.surface,
        border: `0.5px solid ${V4.cardBorder}`,
        boxShadow: V4.cardShadow,
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {category.label}
      </div>

      {/* Leader row */}
      <div
        role="link"
        onClick={() => onNavigate(leader.playerId)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, cursor: 'pointer' }}
      >
        <PlayerAvatar
          playerId={leader.playerId}
          playerName={leader.playerName}
          tourCode={tourCode}
          photoUrl={leader.photoUrl}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: V4.ink, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {leader.playerName}
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, color: V4.inkFaint, letterSpacing: '0.02em', marginTop: 1 }}>
            {category.unit}
          </div>

        </div>
        <div style={{ fontSize: 21, fontWeight: 200, color: V4.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1, flexShrink: 0 }}>
          {category.format(leader.value)}
        </div>
      </div>

      {chasers.length > 0 ? (
        <div style={{ height: '0.5px', background: V4.hairline, margin: '10px 0 6px' }} />
      ) : null}

      {/* Chasers */}
      {chasers.map((c, i) => (
        <div
          key={c.playerId}
          role="link"
          onClick={() => onNavigate(c.playerId)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer' }}
        >
          <span style={{ width: 14, fontSize: 11, fontWeight: 500, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
            {i + 2}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.playerName}
          </span>

          <span style={{ fontSize: 11, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            {category.format(c.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default StatWatch;
