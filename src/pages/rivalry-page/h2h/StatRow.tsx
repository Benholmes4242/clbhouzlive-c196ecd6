/**
 * StatRow — side-by-side stat comparison.
 */
import React from 'react';
import {
  FONT,
  TAB,
  T100,
  T80,
  T60,
  T40,
  GREEN,
  RED,
  LINE,
} from '@/pages/rivalry-page/_shared/tokens';
import type { H2HStatDef } from './_shared/h2hStats';
import { formatValue } from './_shared/h2hStats';
import { whoLeads } from './_shared/whoLeads';

interface Props {
  def: H2HStatDef;
  meValue: unknown;
  themValue: unknown;
  showDivider?: boolean;
}

const GOOD = GREEN;
const BAD = RED;
const GOOD_TINT = 'rgba(5,150,105,0.14)';
const BAD_TINT = 'rgba(159,29,29,0.14)';
const NEUTRAL_TINT = 'rgba(255,255,255,0.05)';

export const StatRow: React.FC<Props> = ({
  def,
  meValue,
  themValue,
  showDivider = true,
}) => {
  const { winner, diff } = whoLeads(def, meValue, themValue);
  const Icon = def.icon;

  const iconBg =
    winner === 'me' ? GOOD_TINT : winner === 'them' ? BAD_TINT : NEUTRAL_TINT;
  const iconColor =
    winner === 'me' ? GOOD : winner === 'them' ? BAD : T60;

  const diffLabel =
    diff > 0
      ? def.decimals != null
        ? `+${diff.toFixed(def.decimals)}`
        : `+${Math.round(diff)}`
      : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '14px 12px',
        borderBottom: showDivider ? `0.5px solid ${LINE}` : 'none',
        fontFamily: FONT,
      }}
    >
      <ValueCell
        value={formatValue(def, meValue)}
        side="me"
        winner={winner}
        alignRight
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          minWidth: 78,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={14} strokeWidth={2.4} color={iconColor} />
        </div>
        <div
          style={{
            color: T60,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {def.label}
        </div>
        {diffLabel && (
          <div
            style={{
              color: T40,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              ...TAB,
            }}
          >
            {diffLabel}
          </div>
        )}
      </div>

      <ValueCell
        value={formatValue(def, themValue)}
        side="them"
        winner={winner}
        alignRight={false}
      />
    </div>
  );
};

interface ValueCellProps {
  value: string;
  side: 'me' | 'them';
  winner: 'me' | 'them' | 'tie';
  alignRight: boolean;
}

const ValueCell: React.FC<ValueCellProps> = ({
  value,
  side,
  winner,
  alignRight,
}) => {
  const isWin = winner === side;
  const isTie = winner === 'tie';
  const color = isWin ? T100 : isTie ? T80 : T40;
  const weight = isWin ? 800 : isTie ? 700 : 400;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignRight ? 'flex-end' : 'flex-start',
        gap: 3,
      }}
    >
      <div
        style={{
          color,
          fontSize: 22,
          fontWeight: weight,
          lineHeight: 1,
          ...TAB,
        }}
      >
        {value}
      </div>
      {isWin && (
        <div
          style={{
            color: GOOD,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          ↑ Lead
        </div>
      )}
    </div>
  );
};
