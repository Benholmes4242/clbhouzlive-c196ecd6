/**
 * LeaderboardBand — section header + 4 rows + CTA.
 * §6 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import type { HeroState, TopTie } from '../HybridHero.utils';
import { fmtScore } from '../HybridHero.utils';
import { SoloLeaderRow, TiedLeadersRow, ChampionRow } from './LeaderRow';
import { ChaserRow } from './ChaserRow';
import { LastYearRow } from './LastYearRow';
import { TeeTimeRow } from './TeeTimeRow';
import { CancelledPanel } from './CancelledPanel';
import { PlayoffPendingPanel } from './PlayoffPendingPanel';
import { INK, INK_15, AMBER } from '../HybridHero.constants';
import type { TeeTimeGroup } from '../../../hooks/useTournamentTeeTimes';

export interface LeaderboardBandProps {
  state: HeroState;
  leaderboard: any[];
  tiedLeaders: TopTie | null;
  cutLine?: number | null;
  champion?: { name: string; country?: string; score: string; playoffWin?: boolean; avatarUrl?: string | null };
  teeTimes?: TeeTimeGroup[];
  lastYearFinishers?: { rank: string; name: string; score: string; year: string; avatarUrl?: string | null }[];
  /** When true and lastYearFinishers is empty, render the inaugural-event placeholder. */
  firstYearEvent?: boolean;
  cancelReason?: string;
  onCtaTap?: () => void;
}

function ctaLabel(state: HeroState): string {
  if (state.kind === 'live') return 'OPEN LIVE LEADERBOARD';
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') return 'VIEW TOUR SCHEDULE';
    if (state.variant === 'awaiting-playoff') return 'VIEW LIVE PLAYOFF';
    return 'VIEW FULL RESULTS';
  }
  return state.variant === 'imminent' ? 'VIEW ALL TEE TIMES' : 'VIEW TOURNAMENT';
}

function header(state: HeroState, leaderboard: any[], tiedLeaders: TopTie | null) {
  if (state.kind === 'live') {
    const meta = tiedLeaders
      ? `${leaderboard.length} players · ${tiedLeaders.count} tied at top`
      : `${leaderboard.length} players`;
    return { left: 'LEADERBOARD', right: meta };
  }
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') return { left: 'STATUS', right: 'Final · No result' };
    if (state.variant === 'awaiting-playoff')
      return { left: 'AWAITING RESOLUTION', right: tiedLeaders ? `${tiedLeaders.count} tied · playoff active` : 'playoff active' };
    if (state.variant === 'declared') return { left: 'FINAL', right: `${leaderboard.length} players · 54 holes · weather` };
    if (state.variant === 'team') return { left: 'TEAM FINAL', right: `${leaderboard.length} teams` };
    return { left: 'FINAL', right: `${leaderboard.length} players` };
  }
  if (state.variant === 'imminent') return { left: 'ROUND 1 · MARQUEE GROUPS', right: 'R1 · marquee groups' };
  // Upcoming far — derive year from any provided last-year row
  return { left: "LAST YEAR'S TOP 4", right: '' };
}

function entryAvatar(entry: any): string | null {
  return entry?.player?.photo_url ?? null;
}

function entryName(entry: any): string {
  const p = entry?.player;
  return p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || '—';
}

function entryThru(entry: any): string {
  if (entry?.thru === 18 || entry?.thru === 'F') return 'F';
  if (entry?.thru == null) return '—';
  return String(entry.thru);
}

export function LeaderboardBand({
  state,
  leaderboard,
  tiedLeaders,
  champion,
  teeTimes,
  lastYearFinishers,
  firstYearEvent,
  cancelReason,
  onCtaTap,
}: LeaderboardBandProps) {
  const h = header(state, leaderboard, tiedLeaders);

  // Body rows by state
  let body: React.ReactNode = null;

  if (state.kind === 'live') {
    if (tiedLeaders) {
      // tied leader row (1) + 3 chasers from non-tied region
      const firstChaser = leaderboard.findIndex(e => (e?.score ?? e?.total) !== leaderboard[0]?.score);
      const chasers = firstChaser >= 0 ? leaderboard.slice(firstChaser, firstChaser + 3) : leaderboard.slice(tiedLeaders.count, tiedLeaders.count + 3);
      body = (
        <>
          <TiedLeadersRow count={tiedLeaders.count} score={tiedLeaders.score} />
          {chasers.map((e, i) => (
            <ChaserRow
              key={i}
              rank={String(e.position)}
              name={entryName(e)}
              score={fmtScore(e.score)}
              thru={entryThru(e)}
              avatarUrl={entryAvatar(e)}
              isLast={i === chasers.length - 1}
            />
          ))}
        </>
      );
    } else {
      const leader = leaderboard[0];
      const chasers = leaderboard.slice(1, 4);
      body = (
        <>
          {leader && (
            <SoloLeaderRow
              rank={String(leader.position ?? 1)}
              name={entryName(leader)}
              country={leader.player?.country_code || leader.player?.country}
              score={fmtScore(leader.score)}
              thru={entryThru(leader)}
              avatarUrl={entryAvatar(leader)}
            />
          )}
          {chasers.map((e, i) => (
            <ChaserRow
              key={i}
              rank={String(e.position)}
              name={entryName(e)}
              score={fmtScore(e.score)}
              thru={entryThru(e)}
              avatarUrl={entryAvatar(e)}
              isLast={i === chasers.length - 1}
            />
          ))}
        </>
      );
    }
  } else if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      body = <CancelledPanel reason={cancelReason} />;
    } else if (state.variant === 'awaiting-playoff') {
      const tiedScore = leaderboard[0]?.score ?? 0;
      const tied = leaderboard
        .filter(e => (e?.score ?? 0) === tiedScore)
        .map(e => ({
          rank: 'T1',
          name: entryName(e),
          country: e.player?.country_code,
          score: fmtScore(e.score),
          avatarUrl: entryAvatar(e),
        }));
      const chasers = leaderboard
        .filter(e => (e?.score ?? 0) !== tiedScore)
        .slice(0, 4)
        .map(e => ({
          rank: String(e.position),
          name: entryName(e),
          score: fmtScore(e.score),
          avatarUrl: entryAvatar(e),
        }));
      body = <PlayoffPendingPanel tied={tied} chasers={chasers} />;
    } else {
      const finishers = leaderboard.slice(0, 4);
      const championRow = champion ?? (finishers[0]
        ? {
            name: entryName(finishers[0]),
            country: finishers[0].player?.country_code,
            score: fmtScore(finishers[0].score),
            avatarUrl: entryAvatar(finishers[0]),
            playoffWin: state.variant === 'playoff',
          }
        : null);
      const rest = finishers.slice(1, 4);
      body = (
        <>
          {championRow && (
            <ChampionRow
              name={championRow.name}
              country={championRow.country}
              score={championRow.score}
              playoffWin={championRow.playoffWin}
              avatarUrl={championRow.avatarUrl}
            />
          )}
          {rest.map((e, i) => (
            <ChaserRow
              key={i}
              rank={String(e.position)}
              name={entryName(e)}
              score={fmtScore(e.score)}
              thru="F"
              avatarUrl={entryAvatar(e)}
              isResults
              isLast={i === rest.length - 1}
            />
          ))}
        </>
      );
    }
  } else {
    // Upcoming
    if (state.variant === 'imminent' && teeTimes && teeTimes.length > 0) {
      const fourGroups = teeTimes.slice(0, 4);
      body = (
        <>
          {fourGroups.map((g, i) => (
            <TeeTimeRow
              key={i}
              time={g.time}
              holeStart={g.holeStart}
              players={g.players}
              isMarquee={g.isMarquee}
              isLast={i === fourGroups.length - 1}
            />
          ))}
        </>
      );
    } else if (lastYearFinishers && lastYearFinishers.length > 0) {
      const four = lastYearFinishers.slice(0, 4);
      body = (
        <>
          {four.map((r, i) => (
            <LastYearRow
              key={i}
              rank={r.rank}
              name={r.name}
              score={r.score}
              year={r.year}
              isWinner={i === 0}
              avatarUrl={r.avatarUrl}
              isLast={i === four.length - 1}
            />
          ))}
        </>
      );
    } else {
      body = (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: 'rgba(15,23,42,0.45)',
            fontSize: 13,
            fontWeight: 600,
            borderTop: `0.5px solid ${INK_15}`,
          }}
        >
          Tournament preview coming soon.
        </div>
      );
    }
  }

  return (
    <div style={{ background: '#F8FAFC' }}>
      {/* section header */}
      <div
        style={{
          padding: '14px 20px 12px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          {h.left}
        </span>
        {h.right && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,23,42,0.45)' }}>{h.right}</span>
        )}
      </div>
      {/* rows */}
      <div style={{ borderTop: `0.5px solid ${INK_15}` }}>{body}</div>
      {/* CTA */}
      <button
        onClick={onCtaTap}
        type="button"
        style={{
          margin: '18px 20px',
          padding: '14px 20px',
          background: INK,
          color: 'white',
          borderRadius: 14,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: 'calc(100% - 40px)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {ctaLabel(state)} <span style={{ opacity: 0.7 }}>›</span>
      </button>
    </div>
  );
}
