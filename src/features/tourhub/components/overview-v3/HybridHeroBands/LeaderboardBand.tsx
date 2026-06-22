/**
 * LeaderboardBand — section header + 4 rows + CTA.
 * §6 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import type { HeroState, TopTie } from '../HybridHero.utils';
import { fmtScore, formatRank, buildLeaderboardSlots, extractRounds } from '../HybridHero.utils';
import { SoloLeaderRow, TiedLeadersRow, ChampionRow, TiedChasersRow } from './LeaderRow';
import { ChaserRow } from './ChaserRow';
import { LastYearRow } from './LastYearRow';
import { TeeTimeRow } from './TeeTimeRow';
import { TeamFinishRow } from './TeamFinishRow';
import { CancelledPanel } from './CancelledPanel';
import { PlayoffPendingPanel } from './PlayoffPendingPanel';
import { INK, INK_15, AMBER } from '../HybridHero.constants';
import { INK_ALPHA_45, FONT, GOLD, GOLD_DEEP } from '../../../_shared/tokens';
import type { TeeTimeGroup } from '../../../hooks/useTournamentTeeTimes';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';


export interface LeaderboardBandProps {
  state: HeroState;
  leaderboard: any[];
  tiedLeaders: TopTie | null;
  cutLine?: number | null;
  champion?: { name: string; country?: string; score: string; playoffWin?: boolean; avatarUrl?: string | null };
  teeTimes?: TeeTimeGroup[];
  lastYearFinishers?: { rank: string; name: string; country?: string | null; score: string; year: string; avatarUrl?: string | null }[];
  /** When true and lastYearFinishers is empty, render the inaugural-event placeholder. */
  firstYearEvent?: boolean;
  cancelReason?: string;
  /** Tour code used to resolve R2 player headshot URLs. */
  tourSlug?: string;
  /** Pass 3: course par for trajectory sparklines. */
  par?: number;
  /** Defending champion name for the live-state footer strip. */
  defendingChampion?: string | null;
  /** Field size (player count) for the live-state footer strip. */
  fieldSize?: number;
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


function entryName(entry: any): string {
  const p = entry?.player;
  return p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || '—';
}

function entryCountry(entry: any): string | null {
  const p = entry?.player;
  return p?.country_code || p?.country || null;
}

function entryThru(entry: any): string {
  if (entry?.thru === 18 || entry?.thru === 'F') return 'F';
  if (entry?.thru == null) return '—';
  return String(entry.thru);
}

function entryPlayerId(entry: any): string | undefined {
  return entry?.player?.id ?? entry?.player_id ?? undefined;
}

function entryAvatarCandidates(entry: any, tourSlug?: string): string[] {
  return resolvePlayerAvatarCandidates({
    name: entryName(entry),
    photoUrl: entry?.player?.photo_url ?? null,
    tourSlug: tourSlug ?? null,
  });
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
  tourSlug,
  par,
  defendingChampion,
  fieldSize,
  onCtaTap,
}: LeaderboardBandProps) {
  const showFooterStrip =
    state.kind === 'live' && (!!defendingChampion || (fieldSize ?? 0) > 0);
  // Single-URL avatar for the stacked-avatar rows (TiedLeaders/TiedChasers) —
  // first candidate from the canonical multi-folder list.
  const entryAvatar = (entry: any) => entryAvatarCandidates(entry, tourSlug)[0] ?? null;
  const entryAvatars = (entry: any) => entryAvatarCandidates(entry, tourSlug);
  const sparklinePar = par ?? 0;


  // Body rows by state
  let body: React.ReactNode = null;

  if (state.kind === 'live') {
    if (tiedLeaders) {
      const firstChaser = leaderboard.findIndex(e => (e?.score ?? e?.total) !== leaderboard[0]?.score);
      const chasers = firstChaser >= 0 ? leaderboard.slice(firstChaser, firstChaser + 3) : leaderboard.slice(tiedLeaders.count, tiedLeaders.count + 3);
      const tiedScore = leaderboard[0]?.score;
      const tiedPlayers = leaderboard
        .filter(e => (e?.score ?? e?.total) === tiedScore)
        .slice(0, tiedLeaders.count)
        .map(e => ({ avatarUrl: entryAvatar(e) }));
      body = (
        <>
          <TiedLeadersRow count={tiedLeaders.count} score={tiedLeaders.score} players={tiedPlayers} />
          {chasers.map((e, i) => (
            <ChaserRow
              key={i}
              rank={formatRank(e)}
              name={entryName(e)}
              country={entryCountry(e)}
              score={fmtScore(e.score)}
              thru={entryThru(e)}
              avatarCandidates={entryAvatars(e)}
              playerId={entryPlayerId(e)}
              isLast={i === chasers.length - 1}
            />
          ))}
        </>
      );
    } else {
      const leader = leaderboard[0];
      const chasers = leaderboard.slice(1);
      const slots = buildLeaderboardSlots(chasers, 3);
      body = (
        <>
          {leader && (
            <SoloLeaderRow
              rank={String(leader.position ?? 1)}
              name={entryName(leader)}
              country={entryCountry(leader)}
              score={fmtScore(leader.score)}
              thru={entryThru(leader)}
              avatarCandidates={entryAvatars(leader)}
              playerId={entryPlayerId(leader)}
            />
          )}
          {slots.map((slot, i) => {
            const isLast = i === slots.length - 1;
            if (slot.kind === 'tie') {
              return (
                <TiedChasersRow
                  key={`tie-${i}`}
                  rank={slot.rank}
                  count={slot.count}
                  score={fmtScore(slot.score)}
                  thru="—"
                  players={slot.members.map((m: any) => ({ avatarUrl: entryAvatar(m) }))}
                  isLast={isLast}
                  onTap={onCtaTap}
                />
              );
            }
            return (
              <ChaserRow
                key={`solo-${i}`}
                rank={formatRank(slot.entry)}
                name={entryName(slot.entry)}
                country={entryCountry(slot.entry)}
                score={fmtScore(slot.entry.score)}
                thru={entryThru(slot.entry)}
                avatarCandidates={entryAvatars(slot.entry)}
                playerId={entryPlayerId(slot.entry)}
                isLast={isLast}
              />
            );
          })}
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
          avatarCandidates: entryAvatars(e),
          playerId: entryPlayerId(e),
        }));
      const chasers = leaderboard
        .filter(e => (e?.score ?? 0) !== tiedScore)
        .slice(0, 4)
        .map(e => ({
          rank: formatRank(e),
          name: entryName(e),
          score: fmtScore(e.score),
          avatarCandidates: entryAvatars(e),
          playerId: entryPlayerId(e),
        }));
      body = <PlayoffPendingPanel tied={tied} chasers={chasers} />;
    } else if (state.variant === 'team') {
      // Team event — render TeamFinishRow for each of the top 4 teams (Polish Patch §3.4)
      const finishers = leaderboard.slice(0, 4);
      body = (
        <>
          {finishers.map((e: any, i: number) => {
            const isChampion = i === 0;
            const team = e?.team;
            const teamName =
              team?.display_name || team?.abbr_name || e?.player?._teamName || entryName(e);
            const members = (team?.members || [])
              .filter((m: any) => m.player)
              .sort((a: any, b: any) => (a.position_in_team ?? 0) - (b.position_in_team ?? 0))
              .map((m: any) => ({
                fullName:
                  m.player.full_name ||
                  `${m.player.first_name ?? ''} ${m.player.last_name ?? ''}`.trim(),
              }));
            return (
              <TeamFinishRow
                key={i}
                rank={e?.position != null ? formatRank(e) : String(i + 1)}
                teamName={teamName}
                teamColor={null}
                teamCrestUrl={null}
                members={members}
                score={fmtScore(e?.score)}
                thru="F"
                isChampion={isChampion}
                isLast={i === finishers.length - 1}
              />
            );
          })}
        </>
      );
    } else {
      // Champion is already in the ChampionStrip above (MiddleBand).
      // Build 4 chaser slots from position 2+, applying tie-collapse rules.
      const chasers = leaderboard.slice(1);
      const slots = buildLeaderboardSlots(chasers, 4);
      body = (
        <>
          {slots.map((slot, i) => {
            const isLast = i === slots.length - 1;
            if (slot.kind === 'tie') {
              return (
                <TiedChasersRow
                  key={`tie-${i}`}
                  rank={slot.rank}
                  count={slot.count}
                  score={fmtScore(slot.score)}
                  thru="F"
                  players={slot.members.map((m: any) => ({
                    avatarUrl: entryAvatar(m),
                    rounds: extractRounds(m),
                  }))}
                  par={sparklinePar}
                  isLast={isLast}
                  isResults
                  onTap={onCtaTap}
                />
              );
            }

            return (
              <ChaserRow
                key={`solo-${i}`}
                rank={formatRank(slot.entry)}
                name={entryName(slot.entry)}
                country={entryCountry(slot.entry)}
                score={fmtScore(slot.entry.score)}
                thru="F"
                avatarCandidates={entryAvatars(slot.entry)}
                playerId={entryPlayerId(slot.entry)}
                rounds={extractRounds(slot.entry)}
                par={sparklinePar}
                isResults
                isLast={isLast}
              />
            );

          })}
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
              country={r.country}
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
      const placeholderText = firstYearEvent
        ? 'INAUGURAL EVENT · NO PRIOR RESULTS'
        : 'Tournament preview coming soon.';
      body = (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: INK_ALPHA_45,
            fontSize: firstYearEvent ? 11 : 13,
            fontWeight: firstYearEvent ? 800 : 600,
            letterSpacing: firstYearEvent ? '0.16em' : 'normal',
            textTransform: firstYearEvent ? 'uppercase' : 'none',
            borderTop: `0.5px solid ${INK_15}`,
          }}
        >
          {placeholderText}
        </div>
      );
    }
  }

  const isResultsCompact =
    state.kind === 'results' &&
    (state.variant === 'standard' || state.variant === 'declared' || state.variant === 'team' || state.variant === 'playoff');
  const useInlineCta = isResultsCompact;

  return (
    <div style={{ background: '#F8FAFC' }}>
      {/* rows */}
      <div>{body}</div>
      {/* Context strip (Defending Champion / Field) sits above the action */}
      {showFooterStrip && (
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            borderTop: `0.5px solid ${INK_15}`,
            background: '#F8FAFC',
            margin: 0,
          }}
        >
          <div style={{ flex: 1, padding: '6px 20px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: INK_ALPHA_45, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {new Date().getFullYear() - 1}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Crown size={12} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP, flexShrink: 0 }} />
              {defendingChampion || '—'}
            </span>
          </div>
          <div style={{ width: '0.5px', background: INK_15, alignSelf: 'stretch' }} />
          <div style={{ padding: '6px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: INK_ALPHA_45, textTransform: 'uppercase' }}>
              Field
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>
              {(fieldSize ?? 0).toLocaleString()}<span style={{ fontWeight: 600, color: INK_ALPHA_45 }}> players</span>
            </span>
          </div>
        </div>
      )}
      {/* Quiet amber CTA — full-width bottom row */}
      <button
        onClick={onCtaTap}
        type="button"
        style={{
          width: '100%',
          padding: '15px 20px',
          background: 'transparent',
          border: 'none',
          borderTop: `0.5px solid ${INK_15}`,
          color: AMBER,
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer',
          fontFamily: FONT,
        }}
        className="active:opacity-70 transition-opacity"
      >
        {ctaLabel(state)}
        <ChevronRight size={12} strokeWidth={2.5} color={AMBER} />
      </button>
    </div>
  );
}
