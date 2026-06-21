/**
 * StatsGroup — section wrapper for a group of StatRows.
 */
import React from 'react';
import {
  FONT,
  TAB,
  BG_1,
  GREEN,
  RED,
  T35,
  T100,
  LINE,
} from '@/pages/rivalry-page/_shared/tokens';
import { StatRow } from './StatRow';
import type { H2HStatDef } from './_shared/h2hStats';
import { whoLeads } from './_shared/whoLeads';

export interface StatItem {
  def: H2HStatDef;
  meValue: unknown;
  themValue: unknown;
}

interface Props {
  title: string;
  subtitle?: string;
  stats: StatItem[];
}

export const StatsGroup: React.FC<Props> = ({ title, stats }) => {
  const tally = stats.reduce(
    (acc, s) => {
      const { winner } = whoLeads(s.def, s.meValue, s.themValue);
      if (winner === 'me') acc.me++;
      else if (winner === 'them') acc.them++;
      return acc;
    },
    { me: 0, them: 0 },
  );

  const showChip = tally.me > 0 || tally.them > 0;

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '26px 2px 10px',
          gap: 12,
        }}
      >
        <div
          style={{
            color: T100,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          {title}
        </div>
        {showChip && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              background: 'rgba(15,23,42,0.05)',
              borderRadius: 999,
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 800,
              ...TAB,
            }}
          >
            <span style={{ color: GREEN }}>{tally.me}</span>
            <span style={{ color: T35 }}>·</span>
            <span style={{ color: RED }}>{tally.them}</span>
          </div>
        )}
      </div>

      <div
        style={{
          background: BG_1,
          border: `0.5px solid ${LINE}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {stats.map((s, i) => (
          <StatRow
            key={s.def.key as string}
            def={s.def}
            meValue={s.meValue}
            themValue={s.themValue}
            showDivider={i < stats.length - 1}
          />
        ))}
      </div>
    </section>
  );
};
