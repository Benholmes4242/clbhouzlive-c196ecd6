import React from 'react';
import { useUserLegendStatus } from '@/hooks/gam/useUserLegendStatus';
import { useUserTopLegends, type TopLegendRow } from '@/hooks/gam/useUserTopLegends';
import { GamCard, Skeleton, RetryStub } from '../_shared/GamAtoms';
import { legendCategoryLabel, legendCategoryEmoji } from '@/lib/gam/visuals';
import type { LegendCategory, UserLegendStatus } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface LegendStatusCardProps {
  userId: string;
  readOnly?: boolean;
  friendName?: string;
}

const RANK_COLORS: Record<1 | 2 | 3, { color: string; bg: string; border: string }> = {
  1: { color: '#FBBC2E', bg: 'rgba(251,188,46,0.12)', border: 'rgba(251,188,46,0.27)' },
  2: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', border: 'rgba(192,192,192,0.27)' },
  3: { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.27)' },
};

const Eyebrow: React.FC = () => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginBottom: 10,
      marginTop: 24,
    }}
  >
    <span style={{ color: '#F7931E', marginRight: 6 }}>•</span>
    LEGEND STATUS
  </div>
);

function shortLabel(category: LegendCategory): string {
  return legendCategoryLabel[category]
    .replace(' Legend', '')
    .replace(' Champ', '')
    .replace(' Record', '');
}

const TitlePill: React.FC<{ category: LegendCategory; courseName: string; rank: number }> = ({
  category,
  courseName,
  rank,
}) => {
  const colors = RANK_COLORS[(rank as 1 | 2 | 3)] ?? RANK_COLORS[3];
  const truncatedCourse =
    courseName.length > 14 ? courseName.slice(0, 13) + '…' : courseName;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: colors.color,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1, textTransform: 'none' }}>
        {legendCategoryEmoji[category]}
      </span>
      <span>
        {shortLabel(category)}
        {' · '}
        {truncatedCourse}
      </span>
    </span>
  );
};

const StatCell: React.FC<{ label: string; value: number; gold?: boolean }> = ({
  label,
  value,
  gold,
}) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: 'var(--hcp-t-40)',
        textTransform: 'uppercase',
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 18,
        fontWeight: 800,
        color: gold ? '#FBBC2E' : 'var(--hcp-t-100)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </div>
  </div>
);

function pluralCourses(n: number): string {
  return n === 1 ? '1 course' : `${n} courses`;
}

function captionForTitles(status: UserLegendStatus): string {
  const top3OnlyCount = Math.max(
    0,
    Number(status.podium_positions) - Number(status.legend_titles),
  );
  const top10OnlyCount = Math.max(
    0,
    Number(status.top_10_positions) - Number(status.podium_positions),
  );
  const parts: string[] = [];
  if (top3OnlyCount > 0) parts.push(`Top 3 at ${top3OnlyCount} more`);
  if (top10OnlyCount > 0) parts.push(`Top 10 at ${top10OnlyCount}`);
  return parts.join(' · ');
}

export const LegendStatusCard: React.FC<LegendStatusCardProps> = ({
  userId,
  readOnly = false,
  friendName,
}) => {
  const { data, isLoading, isError, refetch } = useUserLegendStatus(userId);
  const { data: topLegends } = useUserTopLegends(userId, { limit: 6, maxRank: 3 });

  function handleCardTap() {
    window.dispatchEvent(
      new CustomEvent('legend-status-sheet:open', {
        detail: { userId, readOnly, friendName },
      }),
    );
  }

  if (isError) {
    return (
      <>
        <Eyebrow />
        <div style={{ padding: '0 16px' }}>
          <RetryStub message="Couldn't load Legend Status" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Eyebrow />
        <div style={{ padding: '0 16px' }}>
          <Skeleton height={210} radius={12} />
        </div>
      </>
    );
  }

  const row = data?.[0];
  if (!row) return null;

  const titles = Number(row.legend_titles ?? 0);
  const podiums = Number(row.podium_positions ?? 0);
  const top10 = Number(row.top_10_positions ?? 0);

  // Fully empty — hide entire section
  if (top10 === 0) return null;

  const isOwnView = !readOnly;
  const subjectPossessive = isOwnView
    ? "you're"
    : friendName
      ? `${friendName} is`
      : "they're";
  const subjectNegative = isOwnView
    ? "You haven't"
    : friendName
      ? `${friendName} hasn't`
      : "They haven't";

  let headline: string;
  let caption: string;
  let pills: TopLegendRow[] = [];

  if (titles > 0) {
    headline = `Courses where ${subjectPossessive} legend`;
    caption = captionForTitles(row);
    pills = (topLegends ?? []).slice(0, 6);
  } else {
    headline = `${subjectNegative} claimed a title yet`;
    caption =
      row.best_course_name && row.best_rank
        ? `Closest: Top ${row.best_rank} at ${row.best_course_name}`
        : '';
    if (row.best_category && row.best_course_name && (row.best_rank ?? 99) <= 3) {
      pills = [
        {
          id: 'best',
          category: row.best_category,
          rank: row.best_rank ?? 3,
          value: 0,
          course_id: row.best_course_id ?? '',
          course_name: row.best_course_name,
          attained_at: row.best_attained_at ?? '',
        },
      ];
    }
  }

  const heroNumber = titles > 0 ? titles : top10;
  const allRank1 = pills.length > 0 && pills.every((p) => p.rank === 1);
  const pillRailLabel = allRank1 ? 'RECENT TITLES' : 'TOP POSITIONS';

  return (
    <>
      <Eyebrow />
      <div style={{ padding: '0 16px' }}>
        <GamCard
          onClick={handleCardTap}
          style={{
            background:
              'linear-gradient(135deg, var(--hcp-bg-1) 0%, var(--hcp-bg-2) 60%, rgba(251,188,46,0.06) 100%)',
            border: '1px solid rgba(247,147,30,0.22)',
            position: 'relative',
            overflow: 'hidden',
            padding: '20px 18px 18px',
          }}
        >
          {/* Watermark */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -10,
              top: -10,
              fontSize: 100,
              opacity: 0.04,
              transform: 'rotate(15deg)',
              pointerEvents: 'none',
              lineHeight: 0,
            }}
          >
            👑
          </div>

          {/* Hero row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 18,
              alignItems: 'end',
              marginBottom: 16,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 0.9,
                color: '#FBBC2E',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 24px rgba(251,188,46,0.20)',
              }}
            >
              {heroNumber}
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}
              >
                {headline}
              </div>
              {caption && (
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: 'var(--hcp-t-60)',
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {caption}
                </div>
              )}
            </div>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 0,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 0',
              marginBottom: 14,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <StatCell label="★ TITLES" value={titles} gold />
            <StatCell label="PODIUMS" value={podiums} />
            <StatCell label="TOP 10" value={top10} />
          </div>

          {/* Pill rail */}
          {pills.length > 0 && (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: 'var(--hcp-t-40)',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {pillRailLabel}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {pills.map((p) => (
                  <TitlePill
                    key={p.id}
                    category={p.category}
                    courseName={p.course_name}
                    rank={p.rank}
                  />
                ))}
              </div>
            </div>
          )}
        </GamCard>
      </div>
    </>
  );
};

export default LegendStatusCard;
