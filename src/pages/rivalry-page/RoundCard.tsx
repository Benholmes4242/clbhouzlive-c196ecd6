import React from 'react';
import { MapPin } from 'lucide-react';
import {
  FONT,
  TAB,
  T100,
  T50,
  T35,
  T70,
  AMBER,
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
  showDivider?: boolean;
}

export const RoundCard: React.FC<Props> = ({
  round,
  dim,
  showDivider = true,
}) => {
  const outcome =
    dim === 'stableford' ? round.stableford_outcome : round.gross_outcome;
  const youVal =
    dim === 'stableford' ? round.user_stableford : round.user_gross;
  const themVal =
    dim === 'stableford' ? round.rival_stableford : round.rival_gross;
  const delta = Math.abs((youVal ?? 0) - (themVal ?? 0));
  const unit = dim === 'stableford' ? '' : '';

  const youWon = outcome === 'W';
  const themWon = outcome === 'L';
  const tied = outcome === 'T';

  const chipBg = youWon ? 'rgba(247,147,30,0.14)' : themWon ? 'var(--hcp-bg-2)' : 'rgba(255,255,255,0.06)';
  const chipColor = youWon ? '#C97211' : themWon ? T50 : T50;
  const chipLabel = tied ? '0' : `${youWon ? '+' : '−'}${delta}${unit}`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 12,
        alignItems: 'center',
        padding: '11px 14px',
        borderBottom: showDivider ? `0.5px solid ${LINE}` : 'none',
        fontFamily: FONT,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: T100,
            fontSize: 13,
            fontWeight: 700,
            ...TAB,
          }}
        >
          {formatDate(round.play_date)}
        </div>
        <div
          style={{
            marginTop: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: T50,
            fontSize: 10.5,
            fontWeight: 500,
            maxWidth: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <MapPin size={9} strokeWidth={2.2} />
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

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          fontSize: 15,
          fontWeight: 800,
          ...TAB,
        }}
      >
        <span style={{ color: youWon ? AMBER : T70 }}>
          {youVal ?? '—'}
        </span>
        <span
          style={{
            color: T35,
            fontSize: 11,
            margin: '0 5px',
            fontWeight: 700,
          }}
        >
          vs
        </span>
        <span style={{ color: themWon ? T100 : T50 }}>{themVal ?? '—'}</span>
      </div>

      <div
        style={{
          padding: '4px 9px',
          background: chipBg,
          color: chipColor,
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 800,
          ...TAB,
        }}
      >
        {chipLabel}
      </div>
    </div>
  );
};
