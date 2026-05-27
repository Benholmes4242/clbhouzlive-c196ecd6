/**
 * H2HScoreBanner — "You dominate X of Y categories" headline.
 */
import React from 'react';
import {
  FONT,
  TAB,
  T100,
  T60,
  T40,
  T80,
  GREEN,
  RED,
  AMBER,
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
  const youLead = myWins > theirWins;
  const themLead = theirWins > myWins;
  const tied = !youLead && !themLead;

  const accent = youLead ? GREEN : themLead ? RED : AMBER;
  const eyebrow = youLead
    ? 'You dominate'
    : themLead
      ? `${rivalFirstName} dominates`
      : 'Neck and neck';
  const leaderWins = Math.max(myWins, theirWins);

  const gradient = youLead
    ? 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.02))'
    : themLead
      ? 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.02))'
      : 'linear-gradient(135deg, rgba(247,147,30,0.12), rgba(247,147,30,0.02))';

  const safeTotal = Math.max(total, 1);
  const mePct = (myWins / safeTotal) * 100;
  const tiePct = (ties / safeTotal) * 100;
  const themPct = (theirWins / safeTotal) * 100;

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          marginTop: 4,
          padding: 12,
          background: gradient,
          border: `1px solid ${accent}40`,
          borderRadius: 12,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 4,
            color: T100,
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            ...TAB,
          }}
        >
          {tied ? `${myWins}–${theirWins}` : `${leaderWins} of ${total}`}{' '}
          <span style={{ color: T60, fontSize: 14, fontWeight: 600 }}>
            categories
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            height: 6,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          {mePct > 0 && (
            <div style={{ width: `${mePct}%`, background: GREEN }} />
          )}
          {tiePct > 0 && (
            <div style={{ width: `${tiePct}%`, background: T40 }} />
          )}
          {themPct > 0 && (
            <div style={{ width: `${themPct}%`, background: RED }} />
          )}
        </div>

        <div
          style={{
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            color: T60,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            ...TAB,
          }}
        >
          <span>
            <span style={{ color: GREEN }}>You</span> {myWins}
          </span>
          <span>
            <span style={{ color: T80 }}>Tied</span> {ties}
          </span>
          <span>
            <span style={{ color: RED }}>{rivalFirstName}</span> {theirWins}
          </span>
        </div>
      </div>
    </section>
  );
};
