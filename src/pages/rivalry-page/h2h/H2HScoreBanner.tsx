import React from 'react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T50,
  GREEN,
  RED,
  LINE,
} from '@/pages/rivalry-page/_shared/tokens';

interface Props {
  myWins: number;
  theirWins: number;
  ties: number;
  total: number;
  rivalFirstName: string;
}

export const H2HScoreBanner: React.FC<Props> = ({
  myWins,
  theirWins,
  ties,
  total,
  rivalFirstName,
}) => {
  const safeTotal = Math.max(total, 1);
  const mePct = (myWins / safeTotal) * 100;
  const tiePct = (ties / safeTotal) * 100;
  const themPct = Math.max(0, 100 - mePct - tiePct);
  const leader = myWins >= theirWins ? myWins : theirWins;
  const lead = myWins > theirWins ? 'me' : myWins < theirWins ? 'them' : 'tie';

  const verb =
    lead === 'me'
      ? 'Dominating'
      : lead === 'them'
        ? 'Trailing'
        : 'Tied across';

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          marginTop: 4,
          background: BG_1,
          border: `0.5px solid ${LINE}`,
          borderRadius: 16,
          padding: '14px 16px',
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div
            style={{
              color: T100,
              fontSize: 13.5,
              fontWeight: 800,
              letterSpacing: '-0.005em',
            }}
          >
            {verb}{' '}
            <span style={{ color: lead === 'them' ? RED : GREEN, ...TAB }}>
              {leader} of {total}
            </span>{' '}
            categories
          </div>
          <div
            style={{
              color: T50,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              ...TAB,
            }}
          >
            YOU {myWins} · TIED {ties} · {rivalFirstName.toUpperCase()} {theirWins}
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 2,
            height: 5,
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          {mePct > 0 && <div style={{ width: `${mePct}%`, background: GREEN }} />}
          {tiePct > 0 && (
            <div style={{ width: `${tiePct}%`, background: 'rgba(255,255,255,0.20)' }} />
          )}
          {themPct > 0 && <div style={{ width: `${themPct}%`, background: RED }} />}
        </div>
      </div>
    </section>
  );
};
