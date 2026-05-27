/**
 * StatsGroup — section wrapper for a group of StatRows.
 */
import React from 'react';
import {
  FONT,
  TAB,
  BG_1,
  T60,
  T80,
  AMBER,
  GREEN,
  RED,
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

export const StatsGroup: React.FC<Props> = ({ title, subtitle, stats }) => {
  const tally = stats.reduce(
    (acc, s) => {
      const { winner } = whoLeads(s.def, s.meValue, s.themValue);
      if (winner === 'me') acc.me++;
      else if (winner === 'them') acc.them++;
      return acc;
    },
    { me: 0, them: 0 },
  );

  return (
    <section style={{ padding: '20px 16px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: AMBER,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: FONT,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 2,
                color: T60,
                fontSize: 11,
                fontWeight: 500,
                fontFamily: FONT,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 800,
            ...TAB,
          }}
        >
          <span style={{ color: GREEN }}>{tally.me}</span>
          <span style={{ color: T80 }}>·</span>
          <span style={{ color: RED }}>{tally.them}</span>
        </div>
      </div>

      <div
        style={{
          background: BG_1,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
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
