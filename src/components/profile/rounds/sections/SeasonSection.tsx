/**
 * BRIEF_ROUNDS_TAB_REBUILD_PHASES_3_5 §3.1–3.4 — Your season.
 * Tile 1 is the profile header's plain total (useMemberRoundTotal), OWN PROFILE
 * ONLY: on another profile RLS can return a confident zero, so the tile is
 * absent rather than falling back to rounds.length.
 */
import React from 'react';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { formatNumber } from '@/i18n/format';
import { useMemberRoundTotal } from '@/hooks/profile/useMemberRoundTotal';
import type { ProfileRound } from '../useProfileRounds';
import { coursesInYear, monthsPlayed, seasonCompare, yearStats } from '../roundsDerivations';
import { KICKER, RT, TAB, TITLE, fmt1, note } from './roundsTokens';

interface Props {
  rounds: ProfileRound[];
  year: number;
  userId: string;
  isOwnProfile: boolean;
}

const Tile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={{ flex: 1, background: MEMBER_PANEL, borderRadius: 10, padding: '10px 9px' }}>
    <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: RT.INK, minHeight: 19, ...TAB }}>{value}</div>
    <div style={{ marginTop: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: RT.DIM }}>{label}</div>
  </div>
);

const SeasonSection: React.FC<Props> = ({ rounds, year, userId, isOwnProfile }) => {
  const { total } = useMemberRoundTotal(isOwnProfile ? userId : undefined);
  const ys = yearStats(rounds).get(year);
  const cmp = seasonCompare(rounds, year);
  const courses = coursesInYear(rounds, year);
  const months = monthsPlayed(rounds, year);

  return (
    <section>
      <div style={KICKER}>Your season</div>
      <div style={TITLE}>{`${year}, so far`}</div>

      {ys?.avg != null ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
          <span style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.82, color: RT.INK, ...TAB }}>
            {fmt1(ys.avg)}
          </span>
          <span style={{ paddingBottom: 4 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: RT.BODY }}>scoring average</span>
            <span style={{ display: 'block', fontSize: 12, color: RT.DIM, ...TAB }}>
              {`across ${formatNumber(ys.scoringRounds)} full ${ys.scoringRounds === 1 ? 'round' : 'rounds'} this year`}
            </span>
          </span>
        </div>
      ) : null}

      {cmp.delta != null && cmp.delta !== 0 ? (
        <p style={{ ...note(RT.AMBER), margin: '13px 0 0' }}>
          <strong style={{ color: RT.INK, ...TAB }}>{fmt1(Math.abs(cmp.delta))}</strong>
          {cmp.delta > 0 ? ' better than last year' : ' worse than last year'}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {isOwnProfile ? <Tile value={total != null ? formatNumber(total) : ''} label="Rounds all time" /> : null}
        <Tile value={formatNumber(courses)} label="Courses this year" />
        <Tile value={formatNumber(months)} label="Months played this year" />
      </div>
    </section>
  );
};

export default SeasonSection;
