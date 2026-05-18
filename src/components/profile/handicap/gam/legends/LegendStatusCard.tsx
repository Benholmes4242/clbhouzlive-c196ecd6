import React from 'react';
import { ChevronRight } from 'lucide-react';
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
    courseName.length > 12 ? courseName.slice(0, 11) + '…' : courseName;
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
  const { data: topLegends } = useUserTopLegends(userId, { limit: 3, maxRank: 3 });

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
          <Skeleton height={110} radius={12} />
        </div>
      </>
    );
  }

  const row = data?.[0];
  if (!row) return null;

  const titles = Number(row.legend_titles ?? 0);
  const top10 = Number(row.top_10_positions ?? 0);

  // Fully empty — hide entire section
  if (top10 === 0) return null;

  const isOwnView = !readOnly;
  const subjectName = isOwnView ? "You're" : `${friendName ?? 'They'} is`;
  const subjectNameForEmpty = isOwnView ? "You haven't" : `${friendName ?? 'They'} hasn't`;

  let headline: string;
  let caption: string;
  let pills: TopLegendRow[] = [];

  if (titles > 0) {
    headline = `${subjectName} Legend at ${pluralCourses(titles)}`;
    caption = captionForTitles(row);
    pills = (topLegends ?? []).slice(0, 3);
  } else {
    headline = `${subjectNameForEmpty} claimed a title yet`;
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

  return (
    <>
      <Eyebrow />
      <div style={{ padding: '0 16px' }}>
        <GamCard onClick={handleCardTap}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: caption ? 4 : 0,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {headline}
            </div>
            <ChevronRight
              size={20}
              color="var(--hcp-t-60)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
          </div>
          {caption && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: 'var(--hcp-t-60)',
                lineHeight: 1.4,
              }}
            >
              {caption}
            </div>
          )}
          {pills.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pills.map((p) => (
                <TitlePill
                  key={p.id}
                  category={p.category}
                  courseName={p.course_name}
                  rank={p.rank}
                />
              ))}
            </div>
          )}
        </GamCard>
      </div>
    </>
  );
};

export default LegendStatusCard;
