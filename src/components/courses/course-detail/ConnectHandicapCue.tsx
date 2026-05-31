import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { Users, Trophy, LayoutGrid } from 'lucide-react';
import {
  AMBER,
  INK,
  INK_MUTE,
  INK_FAINT,
  SURFACE,
  HAIRLINE_INK_8,
} from '@/features/courses/_shared/tokens';

type CueVariant = 'about' | 'holes' | 'champions';

const FONT = 'Geist, system-ui, sans-serif';

const COPY: Record<
  CueVariant,
  { Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; benefit: (n: string) => string; sub: (n: string) => string }
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
};

interface Props {
  variant: CueVariant;
  courseName: string;
}

export const ConnectHandicapCue: React.FC<Props> = ({ variant, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading } = useWhsConnection(user?.id);

  if (!user || isLoading || connection) return null;

  const { Icon, benefit, sub } = COPY[variant];
  const go = () => navigate('/handicap');

  // About: lighter inline locked-comparison row
  if (variant === 'about') {
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
            {benefit(courseName)}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
            {sub(courseName)}
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
              {benefit(courseName)}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: INK_MUTE, marginTop: 3, lineHeight: 1.4 }}>
              {sub(courseName)}
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
