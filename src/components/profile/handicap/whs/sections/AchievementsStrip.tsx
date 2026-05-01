import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map as MapIcon,
  Calendar,
  Star,
  Crown,
} from 'lucide-react';
import { useAllScores, useHandicapHistory } from '@/lib/whs/hooks';
import { computeAchievements } from '@/lib/whs/achievements';
import type { Achievement } from '@/lib/whs/types';
import { SectionHeader } from './SectionHeader';

interface Props {
  connectionId: string;
  connectionCreatedAt: string | null;
}

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map: MapIcon,
  Calendar,
};

const TROPHY_TILE_WIDTH = 130;
const HAIRLINE = 'rgba(15,23,42,0.08)';
const GOLD = '#D97706';
const AMBER = '#F7931E';

const TrophyTile: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Star;
  const isHighlight = a.highlight;

  return (
    <div
      style={{
        flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
        position: 'relative',
        padding: '14px 12px',
        borderRadius: 12,
        background: isHighlight
          ? 'linear-gradient(135deg, rgba(247,147,30,0.10) 0%, rgba(247,147,30,0.02) 100%)'
          : '#FAFAF7',
        border: isHighlight
          ? `1.5px solid rgba(247,147,30,0.45)`
          : `1px solid ${HAIRLINE}`,
        scrollSnapAlign: 'start',
      }}
    >
      {isHighlight && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Crown size={12} color={GOLD} fill={GOLD} strokeWidth={2} />
        </div>
      )}

      <Icon
        size={20}
        color={isHighlight ? AMBER : '#64748B'}
        strokeWidth={2}
      />

      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          marginTop: 10,
          marginBottom: 3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.title}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#64748B',
          lineHeight: 1.3,
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.subtitle}
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#94A3B8',
          letterSpacing: '0.02em',
        }}
      >
        {format(new Date(a.achieved_at), 'd MMM yyyy')}
      </div>
    </div>
  );
};

const SkeletonTile: React.FC = () => (
  <div
    style={{
      flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
      height: 120,
      borderRadius: 12,
      background: '#F1F5F9',
      border: `1px solid ${HAIRLINE}`,
    }}
    className="animate-pulse"
  />
);

export const AchievementsStrip: React.FC<Props> = ({
  connectionId,
  connectionCreatedAt,
}) => {
  const { data: scores, isLoading: sLoading } = useAllScores(connectionId);
  const { data: history, isLoading: hLoading } = useHandicapHistory(connectionId, 365);

  const achievements = useMemo<Achievement[]>(() => {
    if (!scores || !history) return [];
    return computeAchievements({
      scores,
      history,
      connectionCreatedAt,
    });
  }, [scores, history, connectionCreatedAt]);

  const isLoading = sLoading || hLoading;

  if (!isLoading && achievements.length === 0) return null;

  const countBadge =
    !isLoading && achievements.length > 0 ? (
      <span
        style={{
          fontSize: 9,
          fontWeight: 900,
          color: AMBER,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {achievements.length} Earned
      </span>
    ) : null;

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        eyebrow="Trophy Cabinet"
        title="What you've earned"
        sub={isLoading ? 'Loading...' : 'Achievements pulled from your real rounds'}
        right={countBadge}
      />

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 8px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)
          : achievements.map((a) => <TrophyTile key={a.id} a={a} />)}
      </div>
    </section>
  );
};

export default AchievementsStrip;
