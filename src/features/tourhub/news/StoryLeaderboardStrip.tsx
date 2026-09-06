/**
 * StoryLeaderboardStrip — BRIEF_WIRE_INDEX_TICKER.
 *
 * The tour news INDEX gains a live leaderboard strip directly beneath the lead
 * story, scoped to THE EVENT THAT STORY IS ABOUT (`tour_stories.tournament_id`).
 * It is the Overview hero's wire, bound to a story instead of a carousel slide.
 *
 * NOT a second state machine: the three states come from `deriveHeroState`, so
 * this strip and the Overview hero can never disagree about what is live.
 * `HeroWireTicker` and `deriveTickerRows` are CONSUMED, never forked — the only
 * thing added locally is the state caption line, because the ticker's own left
 * accessory is a TOP 10 marker and carries no round/result label.
 *
 * NO EVENT, NO STRIP. Null tournament_id, or no photo-led lead that day, and
 * this component is never mounted (see NewsTab). Settled-and-empty renders
 * nothing; PENDING renders a shell of its own height so the story list is not
 * shoved down under the reader's thumb after the fact.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import {
  deriveHeroState,
  deriveTickerRows,
  formatCountdown,
  type TickerRow,
} from '../components/overview-v3/HybridHero.utils';
import type { HeroTournament } from '../hooks/useHeroCarouselData';
import { HeroWireTicker, type TickerFact } from '../components/overview-v3/HybridHeroBands/HeroWireTicker';
import {
  FONT,
  LIVE_INK,
} from '../_shared/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/** Caption line + 36px ticker. Held as a constant so the pending shell matches. */
const CAPTION_HEIGHT = 28;
const TICKER_HEIGHT = 36;
export const STORY_STRIP_HEIGHT = CAPTION_HEIGHT + TICKER_HEIGHT;

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ boxSizing: 'border-box', background: A.PANEL, border: `1px solid ${A.BORDER}`, width: '100%', minHeight: STORY_STRIP_HEIGHT, fontFamily: FONT }}>
      {children}
    </div>
  );
}

export function StoryLeaderboardStrip({ tournamentId }: { tournamentId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');

  /**
   * The tournament RECORD. The story only carries an id, and deriveHeroState
   * needs status / dates / current round — so this is the existing single-row
   * `sr_tournaments` read (useTourTournament), not a new query.
   */
  const { data: tournament, isPending: tournamentPending } = useTourTournament(tournamentId);
  /** ONE leaderboard read, for the LEAD story's event only. */
  const { data: leaderboard, isPending: boardPending } = useTourLeaderboard(tournamentId);

  const state = useMemo(() => {
    if (!tournament) return null;
    const t0 = tournament as any;
    const hero = {
      id: t0.id,
      name: t0.name,
      status: t0.status,
      startDate: t0.start_date,
      endDate: t0.end_date,
      currentRound: t0.current_round ?? null,
      currentRoundStatus: t0.current_round_status ?? null,
      tourSlug: (t0.tour_code || '').toLowerCase(),
    } as unknown as HeroTournament;
    return deriveHeroState(hero);
  }, [tournament]);

  const rows: TickerRow[] = useMemo(() => deriveTickerRows(leaderboard ?? []), [leaderboard]);

  // Unresolved is not absent.
  if (tournamentPending || boardPending) return <Shell />;
  if (!tournament || !state) return null;

  const isLive = state.kind === 'live';

  /* UPCOMING — no board exists yet, so the wire carries the countdown and the
     hero's own "awaiting the field" facts. Never a half-populated live strip. */
  let emptyStateFacts: TickerFact[] | undefined;
  if (state.kind === 'upcoming') {
    const facts: TickerFact[] = [];
    const start = (tournament as any).start_date ? new Date((tournament as any).start_date) : null;
    if (start) {
      facts.push({
        label: t('news.strip.startsIn', 'STARTS IN'),
        value: formatCountdown(start),
        pulseLabel: true,
      });
    }
    if (state.meta) facts.push({ label: t('overview.hero.teesOff'), value: state.meta });
    if ((tournament as any).venue_name) {
      facts.push({ label: t('overview.hero.venueLabel'), value: (tournament as any).venue_name });
    }
    const purse = (tournament as any).purse;
    if (typeof purse === 'number' && purse > 0) {
      const m = purse / 1_000_000;
      facts.push({ label: t('overview.hero.purse'), value: m >= 10 ? `$${Math.round(m)}M` : `$${m.toFixed(1)}M` });
    }
    emptyStateFacts = facts;
  }

  // LIVE with an empty board (round scheduled, no scores in yet) — the caption
  // still states the round; the wire falls back to the event's own facts rather
  // than an empty marquee.
  if (rows.length === 0 && !emptyStateFacts) {
    const facts: TickerFact[] = [];
    if ((tournament as any).venue_name) {
      facts.push({ label: t('overview.hero.venueLabel'), value: (tournament as any).venue_name });
    }
    facts.push({
      label: t('overview.leaderboardBand.fieldEyebrow').toUpperCase(),
      value: t('news.strip.awaitingScores', 'AWAITING SCORES'),
      pulseLabel: true,
    });
    emptyStateFacts = facts;
  }

  const caption = isLive
    ? state.round
      ? t('news.liveRound', { defaultValue: 'LIVE \u00b7 ROUND {{n}}', n: state.round })
      : t('news.live', 'LIVE')
    : state.kind === 'results'
      ? t('news.finalResult', 'FINAL RESULT')
      : t('news.tournament', 'TOURNAMENT');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/tourhub/tournament/${tournamentId}`);
      }}
      aria-label={`${caption} \u00b7 ${(tournament as any).name ?? ''}`}
      style={{ boxSizing: 'border-box', background: A.PANEL, border: `1px solid ${A.BORDER}`, width: '100%', fontFamily: FONT, cursor: 'pointer' }}
    >
      <div
        style={{
          height: CAPTION_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 14px',
        }}
      >
        {isLive && (
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: LIVE_INK, flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: isLive ? LIVE_INK : 'rgba(255,255,255,0.50)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {caption}
        </span>
        <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.82)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {(tournament as any).name}
        </span>
      </div>
      <HeroWireTicker rows={emptyStateFacts ? [] : rows} emptyStateFacts={emptyStateFacts} labelKind="top10" />
    </div>
  );
}

export default StoryLeaderboardStrip;
