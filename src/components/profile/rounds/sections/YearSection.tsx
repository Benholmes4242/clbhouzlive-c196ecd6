/**
 * BRIEF_ROUNDS_TAB_REBUILD_PHASES_3_5 §3.5–3.12 — The year. Plain SVG (no
 * recharts on member surfaces). Future months are hollow stubs, never zero.
 * The average line BREAKS across months with no scoring round.
 */
import React from 'react';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import type { ProfileRound } from '../useProfileRounds';
import { monthHighlights, monthStats } from '../roundsDerivations';
import { KICKER, RT, SR_ONLY, TITLE, fmt1, note } from './roundsTokens';

interface Props {
  rounds: ProfileRound[];
  year: number;
  /** "Today", passed in. */
  today: Date;
}

const INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BAR_W = 22.8;
const GAP = 5;
const BASE = 82;
const BAR_TOP = 8;
const LINE_TOP = 10;
const LINE_BOTTOM = 60;
const x0 = (i: number) => i * (BAR_W + GAP);
const cx = (i: number) => x0(i) + BAR_W / 2;

const YearSection: React.FC<Props> = ({ rounds, year, today }) => {
  const ms = monthStats(rounds, year);
  const isCurrent = today.getFullYear() === year;
  const isFuture = (i: number) => isCurrent && i > today.getMonth();
  const maxN = Math.max(0, ...ms.map((m) => m.rounds));
  const avgs = ms.map((m) => m.avg).filter((a): a is number => a != null);
  const lo = avgs.length ? Math.min(...avgs) : 0;
  const hi = avgs.length ? Math.max(...avgs) : 0;
  // Lower score plots HIGHER. A flat year sits mid-band.
  const y = (a: number) => (hi === lo ? (LINE_TOP + LINE_BOTTOM) / 2 : LINE_TOP + ((a - lo) / (hi - lo)) * (LINE_BOTTOM - LINE_TOP));

  const segments: string[] = [];
  let cur: string[] = [];
  ms.forEach((m, i) => {
    if (m.avg == null) {
      if (cur.length) segments.push(cur.join(' '));
      cur = [];
    } else cur.push(`${cur.length ? 'L' : 'M'}${cx(i).toFixed(2)},${y(m.avg).toFixed(2)}`);
  });
  if (cur.length) segments.push(cur.join(' '));

  const hl = monthHighlights(rounds, year);

  return (
    <section>
      <div style={KICKER}>The year</div>
      <div style={TITLE}>The shape of it</div>

      <div style={{ background: MEMBER_PANEL, borderRadius: 12, padding: '10px 10px 2px', marginTop: 14 }}>
        <svg viewBox="0 0 329 112" width="100%" height={112} style={{ display: 'block' }} aria-hidden>
          <line x1={0} x2={329} y1={BASE + 0.5} y2={BASE + 0.5} stroke={RT.BASELINE} strokeWidth={1} />
          {ms.map((m, i) => {
            if (isFuture(i)) {
              return <rect key={i} x={x0(i)} y={BASE - 3} width={BAR_W} height={3} rx={1} fill={RT.TRACK} />;
            }
            if (m.rounds === 0 || maxN === 0) return null;
            const h = (m.rounds / maxN) * (BASE - BAR_TOP);
            return <rect key={i} x={x0(i)} y={BASE - h} width={BAR_W} height={h} rx={2.5} fill={RT.AMBER} fillOpacity={0.85} />;
          })}
          {segments.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={RT.GREEN} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
          ))}
          {ms.map((m, i) => (m.avg != null ? <circle key={i} cx={cx(i)} cy={y(m.avg)} r={1.9} fill={RT.GREEN} opacity={0.9} /> : null))}
          {INITIALS.map((l, i) => (
            <text key={i} x={cx(i)} y={104} textAnchor="middle" fontSize={8.5} fontWeight={700} letterSpacing="0.06em" fill={RT.FAINT}>{l}</text>
          ))}
        </svg>
      </div>

      <ul style={SR_ONLY}>
        {ms.map((m, i) => (m.rounds > 0 ? (
          <li key={i}>
            {`${MONTHS[i]} ${year}: ${m.rounds} ${m.rounds === 1 ? 'round' : 'rounds'} played`}
            {m.avg != null ? `, scoring average ${fmt1(m.avg)} over ${m.scoringRounds} full ${m.scoringRounds === 1 ? 'round' : 'rounds'}` : ''}
          </li>
        ) : null))}
      </ul>

      <div style={{ display: 'flex', gap: 16, marginTop: 8 }} aria-hidden>
        {[{ c: RT.AMBER, l: 'Rounds played' }, { c: RT.GREEN, l: 'Scoring average' }].map((k) => (
          <span key={k.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: RT.DIM }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: k.c }} />{k.l}
          </span>
        ))}
      </div>

      {hl ? (
        <p style={{ ...note(RT.HAIRLINE), margin: '12px 0 0' }}>
          {`You play most in ${MONTHS[hl.busiest]} and score best in ${MONTHS[hl.best]}`}
        </p>
      ) : null}
    </section>
  );
};

export default YearSection;
