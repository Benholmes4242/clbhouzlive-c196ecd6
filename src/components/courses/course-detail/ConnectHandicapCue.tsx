import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { Users, Trophy, LayoutGrid, Sparkles, Map, type LucideIcon } from 'lucide-react';
import {
  AMBER,
  INK,
  INK_MUTE,
  INK_FAINT,
  SURFACE,
  HAIRLINE_INK_8,
} from '@/features/courses/_shared/tokens';

type CueVariant =
  | 'about'
  | 'holes'
  | 'champions'
  | 'progress'
  | 'leaderboard'
  | 'discover'
  | 'tour-venue'
  | 'tour-holes';

const FONT = 'Geist, system-ui, sans-serif';

const COPY: Record<
  CueVariant,
  { Icon: LucideIcon; benefit: (n: string) => string; sub: (n: string) => string }
> = {
  about: {
    Icon: Users,
    benefit: () => 'See how your handicap compares here',
    sub: () => 'Friends, members and the world’s best at this course',
  },
  holes: {
    Icon: LayoutGrid,
    benefit: () => 'See your scoring on every hole',
    sub: (n) => `Your average vs everyone who’s played ${n}, hole by hole.`,
  },
  champions: {
    Icon: Trophy,
    benefit: () => 'See where you rank at this course',
    sub: (n) => `Connect your handicap and your rounds join the ${n} leaderboard.`,
  },
  progress: {
    Icon: Sparkles,
    benefit: () => 'Fill in your Top 100 automatically',
    sub: () => 'Connect your handicap and every round you play counts itself — no manual logging.',
  },
  leaderboard: {
    Icon: Trophy,
    benefit: () => 'See where you rank worldwide',
    sub: () => 'Connect your handicap to join the championship and climb the global rankings.',
  },
  discover: {
    Icon: Map,
    benefit: () => 'See which of these you’ve played',
    sub: () => 'Connect your handicap to see how you scored at every course.',
  },
  'tour-venue': {
    Icon: Trophy,
    benefit: (n) => `See how you'd score at ${n}`,
    sub: () => 'Connect your WHS handicap to compare your game to this week’s venue.',
  },
  'tour-holes': {
    Icon: LayoutGrid,
    benefit: () => 'See your scoring on these holes vs the field',
    sub: () => 'Connect your WHS handicap to measure your game against the pros’, hole by hole.',
  },
};

interface Props {
  variant: CueVariant;
  courseName?: string;
}

export const ConnectHandicapCue: React.FC<Props> = ({ variant, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading } = useWhsConnection(user?.id);

  if (!user || isLoading || connection) return null;

  const { Icon, benefit, sub } = COPY[variant];
  const go = () => navigate('/handicap');

  const name = courseName ?? '';
  const isBanner = variant === 'about' || variant === 'discover';

  // Banner: lighter inline locked-comparison row (about / discover)
  if (isBanner) {
    return (
      <button
        type="button"
        onClick={go}
        style={{
          marginTop: 12,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: SURFACE,
          border: `1px solid ${HAIRLINE_INK_8}`,
          borderLeft: `3px solid ${AMBER}`,
          borderRadius: 10,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(247,147,30,0.10)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={AMBER} strokeWidth={2.25} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            {benefit(name)}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
            {sub(name)}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Connect →
        </span>
      </button>
    );
  }

  // Holes + Champions: amber card
  return (
    <div style={{ padding: '12px 16px 4px' }}>
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${HAIRLINE_INK_8}`,
          borderLeft: `3px solid ${AMBER}`,
          borderRadius: 12,
          padding: '14px 14px 12px',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(247,147,30,0.10)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} color={AMBER} strokeWidth={2.25} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
              {benefit(name)}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: INK_MUTE, marginTop: 3, lineHeight: 1.4 }}>
              {sub(name)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={go}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '10px 14px',
            background: AMBER,
            color: SURFACE,
            border: 'none',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Connect your handicap →
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 10.5,
            fontWeight: 600,
            color: INK_FAINT,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Works with WHS handicaps worldwide
        </div>
      </div>
    </div>
  );
};

export default ConnectHandicapCue;
