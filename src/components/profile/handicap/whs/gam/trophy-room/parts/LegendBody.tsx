import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, MapPin, ExternalLink } from 'lucide-react';
import { GAM } from '../../tokens';
import { relativeTime, legendCategoryWindow } from '@/lib/gam/visuals';
import type { LegendCategory } from '@/lib/gam/types';
import { FriendsBlock } from './FriendsBlock';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'legend' }>;
  viewerUserId: string;
  onNavigateClose: () => void;
}

const LEGEND_CATEGORY_COPY: Record<LegendCategory, string> = {
  lowest_gross_90d:         'Lowest gross score posted at this course in the last 90 days.',
  lowest_gross_all_time:    'Lowest gross score ever posted at this course.',
  best_score_diff_90d:      'Best score differential vs handicap in the last 90 days.',
  best_score_diff_all_time: 'Best score differential vs handicap of all time.',
  most_birdies_90d:         'Most birdies in the last 90 days at this course.',
  most_birdies_all_time:    'Most birdies ever recorded at this course.',
  best_stableford_90d:      'Highest Stableford points in the last 90 days at this course.',
  best_stableford_all_time: 'Highest Stableford points ever recorded at this course.',
  most_eagles_90d:          'Most eagles in the last 90 days at this course.',
  most_eagles_all_time:     'Most eagles ever recorded at this course.',
  most_aces_90d:            'Most hole-in-ones in the last 90 days at this course.',
  most_aces_all_time:       'Most hole-in-ones ever recorded at this course.',
  most_albatrosses_90d:     'Most albatrosses in the last 90 days at this course.',
  most_albatrosses_all_time:'Most albatrosses ever recorded at this course.',
  most_rounds_90d:          'Most rounds played at this course in the last 90 days.',
  most_rounds_all_time:     'Most rounds ever played at this course.',
};

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: color ?? 'var(--hcp-t-60)',
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

export const LegendBody: React.FC<Props> = ({ item, viewerUserId, onNavigateClose }) => {
  const navigate = useNavigate();
  const description = LEGEND_CATEGORY_COPY[item.category] ?? '';
  const isRolling = legendCategoryWindow[item.category] === '90d';

  const handleCourseTap = () => {
    onNavigateClose();
    setTimeout(() => navigate(`/courses/${item.courseId}`), 100);
  };

  return (
    <div
      style={{
        padding: '20px 20px 24px',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {item.name}
        </h2>

        <button
          type="button"
          onClick={handleCourseTap}
          style={{
            marginTop: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 999,
            cursor: 'pointer',
            color: 'var(--hcp-t-100)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <MapPin size={12} color={GAM.AMBER} />
          {item.courseName}
          <ExternalLink size={10} color="var(--hcp-t-60)" />
        </button>

        {description && (
          <p style={{ fontSize: 13.5, color: 'var(--hcp-t-60)', lineHeight: 1.45, margin: '12px 0 0' }}>
            {description}
          </p>
        )}
      </div>

      {/* YOUR TITLE card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(251,188,46,0.18) 0%, rgba(247,147,30,0.10) 100%)',
          border: '1px solid rgba(251,188,46,0.32)',
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Crown size={12} color={GAM.GOLD} />
          <Eyebrow color={GAM.GOLD}>YOUR {item.rank === 1 ? 'TITLE' : `RANK · #${item.rank}`}</Eyebrow>
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: GAM.GOLD, letterSpacing: '-0.02em', ...GAM.TABULAR }}>
          {item.formattedValue}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--hcp-t-60)', marginTop: 6 }}>
          Held since {relativeTime(item.attainedAt)}
        </div>
      </div>

      <FriendsBlock
        legendCategory={item.category}
        legendCourseId={item.courseId}
        viewerUserId={viewerUserId}
      />

      <div
        style={{
          fontSize: 10.5,
          color: 'var(--hcp-t-60)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {isRolling
          ? '90-day window · title resets when window rolls over'
          : 'All-time course record · permanent'}
      </div>
    </div>
  );
};

export default LegendBody;
