import React from 'react';
import { MapPin } from 'lucide-react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T60,
  T40,
  T80,
  GOLD,
  GREEN,
  RED,
  LINE,
} from './_shared/tokens';
import { formatDate } from './_shared/helpers';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

type Round = FriendRivalryHydrated['shared_round_results'][number];

interface Props {
  round: Round;
  dim: RivalryDimension;
  rivalFirstName: string;
  youLabel: string;
}

export const RoundCard: React.FC<Props> = ({
  round,
  dim,
  rivalFirstName,
  youLabel,
}) => {
  const outcome =
    dim === 'stableford' ? round.stableford_outcome : round.gross_outcome;
  const youVal =
    dim === 'stableford' ? round.user_stableford : round.user_gross;
  const themVal =
    dim === 'stableford' ? round.rival_stableford : round.rival_gross;
  const delta = Math.abs((youVal ?? 0) - (themVal ?? 0));
  const unit = dim === 'stableford' ? ' pts' : '';

  const youWon = outcome === 'W';
  const themWon = outcome === 'L';
  const tied = outcome === 'T';

  const chipBg = youWon
    ? 'rgba(34,197,94,0.14)'
    : themWon
      ? 'rgba(239,68,68,0.14)'
      : 'rgba(255,255,255,0.06)';
  const chipColor = youWon ? GREEN : themWon ? RED : T40;

  return (
    <div
      style={{
        padding: 14,
        background: BG_1,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        fontFamily: FONT,
      }}
    >
      {/* Top — date + course */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            color: T80,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            ...TAB,
          }}
        >
          {formatDate(round.play_date)}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: T60,
            fontSize: 11,
            fontWeight: 600,
            maxWidth: '60%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <MapPin size={11} strokeWidth={2.2} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {round.course_name.replace(' Course', '')}
          </span>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            color: T100,
            fontSize: 16,
            fontWeight: 700,
            ...TAB,
          }}
        >
          <ScoreCell label={youLabel} value={youVal ?? 0} won={youWon} />
          <span style={{ color: T40, fontSize: 11, fontWeight: 600 }}>vs</span>
          <ScoreCell
            label={rivalFirstName}
            value={themVal ?? 0}
            won={themWon}
          />
        </div>
        <div
          style={{
            padding: '5px 9px',
            background: chipBg,
            color: chipColor,
            border: `1px solid ${chipColor}33`,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.02em',
            ...TAB,
          }}
        >
          {tied ? 'Tied' : `${youWon ? '+' : '−'}${delta}${unit}`}
        </div>
      </div>
    </div>
  );
};

const ScoreCell: React.FC<{ label: string; value: number; won: boolean }> = ({
  label,
  value,
  won,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div
      style={{
        color: T60,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: won ? GOLD : T100,
        fontSize: 20,
        fontWeight: 800,
        lineHeight: 1,
        ...TAB,
      }}
    >
      {value}
    </div>
  </div>
);
