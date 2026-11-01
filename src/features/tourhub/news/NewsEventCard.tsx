/** Tour News event card (BRIEF_TOUR_NEWS_PAGE §3) — replaces the scrolling
 * ticker under the lead story. State comes from deriveHeroState, exactly as
 * the strip used it, so the card can never disagree with the overview:
 * before = start date and countdown, live = the top three (a followed player
 * is amber, in the top three or as a fourth row), finished = the winner.
 * The card does not move or scroll. */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTourTournament } from '../hooks/useTourHubData';
import { deriveHeroState, detectTopTie, formatRank, fmtScore, isInPlayState } from '../components/overview-v3/HybridHero.utils';
import type { HeroTournament } from '../hooks/useHeroCarouselData';
import { fmtThru, todayFromEntry, type BoardEntry } from '../leaderboard/BoardTable';
import { getScoreColor } from '../_shared/scoreColor';
import { surnameOf } from '../_shared/playerName';
import { displayEventName } from '../overview/sections/ComingUp';
import { eventStartLine, marginWord } from './newsPageRules';
import { useNewsEventBoard } from './newsPageData';

function EventRow({ entry, round, followed }: { entry: BoardEntry; round: number | null; followed: boolean }) {
  const thru = round == null || todayFromEntry(entry, round) == null || !entry.thru ? '' : fmtThru(entry.thru);
  return (
    <div className={`tour-news-event-row${followed ? ' you' : ''}`} data-testid="tour-news-event-row">
      <span className="pos tabular-nums">{formatRank(entry)}</span>
      <span>{followed ? `★ ${surnameOf(entry.player?.full_name)}` : surnameOf(entry.player?.full_name)}</span>
      <span className="thru tabular-nums">{thru}</span>
      <span className="score tabular-nums" style={{ color: getScoreColor(entry.score, 'dark') }}>{fmtScore(entry.score, { absent: '' })}</span>
    </div>
  );
}

export function NewsEventCard({ tournamentId, follows }: { tournamentId: string; follows: Set<string> }) {
  const navigate = useNavigate();
  const { data: tournament, isPending } = useTourTournament(tournamentId);
  const state = useMemo(() => {
    if (!tournament) return null;
    const t0 = tournament as Record<string, unknown>;
    return deriveHeroState({
      id: t0.id,
      name: t0.name,
      status: t0.status,
      startDate: t0.start_date,
      endDate: t0.end_date,
      currentRound: (t0.current_round as number | null) ?? null,
      currentRoundStatus: (t0.current_round_status as string | null) ?? null,
      tourSlug: String(t0.tour_code ?? '').toLowerCase(),
    } as unknown as HeroTournament);
  }, [tournament]);
  const live = !!state && isInPlayState(state);
  const { data: board } = useNewsEventBoard(tournamentId, !!state);

  if (isPending || !tournament || !state) return null;

  const name = displayEventName((tournament as { name?: string }).name ?? '');
  const open = () => navigate(`/tourhub/tournament/${tournamentId}`);
  const entries = board ?? [];

  let body: React.ReactNode = null;
  if (live && state.kind === 'live') {
    const top = entries.slice(0, 3);
    const extra = entries.slice(3).find((entry) => entry.player?.id && follows.has(entry.player.id));
    body = (
      <>
        <div className="tour-news-event-board">
          {top.map((entry) => (
            <EventRow key={entry.id} entry={entry} round={state.round} followed={!!entry.player?.id && follows.has(entry.player.id)} />
          ))}
          {extra && <EventRow entry={extra} round={state.round} followed />}
        </div>
        <div className="tour-news-event-sub" style={{ marginTop: 6 }}>Full leaderboard ›</div>
      </>
    );
  } else if (state.kind === 'results') {
    const winner = entries[0];
    const tie = detectTopTie(entries);
    const winnerName = surnameOf(winner?.player?.full_name ?? '');
    body = (
      <div className="tour-news-event-sub" data-testid="tour-news-event-result">
        {winner && tie ? (
          <><b>{winnerName}</b> won in a playoff.</>
        ) : winner ? (
          <><b>{winnerName}</b> won at <b>{fmtScore(winner.score, { absent: '' })}</b>{entries[1] && winner.score != null && entries[1].score != null ? `, by ${marginWord(entries[1].score - winner.score)}` : ''}.</>
        ) : (
          'Final result'
        )}
      </div>
    );
  } else {
    const start = eventStartLine((tournament as { start_date?: string | null }).start_date);
    // "Field not out yet" while no round-1 draw exists; a loading board omits
    // the clause rather than guessing.
    const fieldOut = board === undefined ? null : entries.length > 0;
    body = (
      <div className="tour-news-event-sub" data-testid="tour-news-event-start">
        {start && <>Starts <b>{start.date}</b> · {start.countdown}</>}
        {fieldOut === false && <> · field not out yet</>}
      </div>
    );
  }

  return (
    <button type="button" className="tour-news-event" onClick={open} data-testid="tour-news-event-card" aria-label={`${name} leaderboard`}>
      <div className="tour-news-event-top">
        <span className="tour-news-event-name">{name}</span>
        {live && state.kind === 'live' ? (
          <span className="overview-news-live"><i aria-hidden />Live · R{state.round}</span>
        ) : (
          <ChevronRight size={15} color="rgba(248,250,252,0.42)" aria-hidden />
        )}
      </div>
      {body}
    </button>
  );
}

export default NewsEventCard;
