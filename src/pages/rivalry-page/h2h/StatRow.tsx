/**
 * StatRow — "tape row" compact comparison (~44px).
 */
import React from 'react';
import {
  FONT,
  TAB,
  T100,
  T50,
  T70,
  AMBER,
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

const TRACK = 'rgba(255,255,255,0.07)';
const NEUTRAL_SEG = 'rgba(255,255,255,0.18)';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export const StatRow: React.FC<Props> = ({
  def,
  meValue,
  themValue,
  showDivider = true,
}) => {
  const isHotFlag = def.format === 'hot_flag';
  const { winner } = whoLeads(def, meValue, themValue);

  const meStr = formatValue(def, meValue);
  const themStr = formatValue(def, themValue);

  // Magnitudes for bar share (lower-better inverts)
  let share = 0.5;
  if (!isHotFlag) {
    const m = Number(meValue);
    const t = Number(themValue);
    const mOk = Number.isFinite(m);
    const tOk = Number.isFinite(t);
    if (mOk && tOk) {
      const am = Math.abs(m);
      const at = Math.abs(t);
      const sum = am + at;
      if (sum > 0) {
        share = am / sum;
        if (def.format === 'low_better') share = 1 - share;
      }
    }
  }
  share = clamp(share, 0.06, 0.94);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1fr 56px',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderBottom: showDivider ? `0.5px solid ${LINE}` : 'none',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          textAlign: 'left',
          color: isHotFlag
            ? T70
            : winner === 'me'
              ? AMBER
              : winner === 'them'
                ? T50
                : T100,
          fontSize: isHotFlag ? 13 : 16,
          fontWeight: 800,
          letterSpacing: isHotFlag ? '0.10em' : undefined,
          ...TAB,
        }}
      >
        {meStr}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            color: T50,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {def.label}
        </div>
        {!isHotFlag && (
          <DominanceBar share={share} winner={winner} />
        )}
      </div>

      <div
        style={{
          textAlign: 'right',
          color: isHotFlag
            ? T70
            : winner === 'them'
              ? T100
              : T50,
          fontSize: isHotFlag ? 13 : 16,
          fontWeight: 800,
          letterSpacing: isHotFlag ? '0.10em' : undefined,
          ...TAB,
        }}
      >
        {themStr}
      </div>
    </div>
  );
};

const DominanceBar: React.FC<{ share: number; winner: 'me' | 'them' | 'tie' }> = ({
  share,
  winner,
}) => {
  if (winner === 'tie') {
    return (
      <div
        style={{
          width: '100%',
          height: 3.5,
          borderRadius: 999,
          background: TRACK,
          display: 'flex',
          gap: 2,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '50%', background: NEUTRAL_SEG }} />
        <div style={{ width: '50%', background: NEUTRAL_SEG }} />
      </div>
    );
  }
  if (winner === 'me') {
    return (
      <div
        style={{
          width: '100%',
          height: 3.5,
          borderRadius: 999,
          background: TRACK,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${share * 100}%`, height: '100%', background: AMBER }} />
      </div>
    );
  }
  // them leads — neutral share + muted grey remainder (no red)
  return (
    <div
      style={{
        width: '100%',
        height: 3.5,
        borderRadius: 999,
        background: TRACK,
        display: 'flex',
        gap: 2,
        overflow: 'hidden',
      }}
    >
      <div style={{ width: `${share * 100}%`, background: NEUTRAL_SEG }} />
      <div style={{ flex: 1, background: 'rgba(148,163,184,0.55)' }} />
    </div>
  );
};
