/**
 * SeasonCards - "This Season" stat group.
 *
 * Four stats about ONE player, so this is a stat group and not a card rail:
 * centred label-above-figure cells, no surface, no border, no radius.
 *
 * When useSinglePlayerStatistics has a row: TOP 10s / WINS / SCORING /
 * EARNINGS + the quiet 'All stats' action opens the StatsSheet. When the row
 * is missing (euro/LPGA sync gaps): derive EVENTS / BEST FINISH / MADE CUTS
 * from the leaderboard rows and drop the sheet action.
 * Per-field null discipline: cards with no derivable value are omitted rather
 * than shown as dashes.
 *
 * Money goes through the single shared formatter (_shared/formatEarnings) so a
 * player's earnings and his college's earnings read identically.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { StatsSheet } from '../StatsSheet';
import { formatEarnings } from '../../_shared/formatEarnings';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { mapTourSlug } from '../../_shared/tourOrder';
import { INK, INK_FAINT, SLATE_50 } from '../../_shared/tokens';

interface SeasonCardsProps {
  playerStats: TourPlayerStatistics | null;
  results: PlayerTournamentResult[];
  player: TourPlayer;
}

interface Card {
  key: string;
  label: string;
  value: string;
}

function fromStats(s: TourPlayerStatistics, t: TFunction): Card[] {
  const cards: Card[] = [];
  if (typeof s.top_10s === 'number' && s.top_10s >= 0)
    cards.push({ key: 'top10', label: t('player.season.card.top10s'), value: String(s.top_10s) });
  if (typeof s.wins === 'number' && s.wins >= 0)
    cards.push({ key: 'wins', label: t('player.season.card.wins'), value: String(s.wins) });
  if (typeof s.scoring_average === 'number' && s.scoring_average > 0)
    cards.push({ key: 'scoring', label: t('player.season.card.scoring'), value: s.scoring_average.toFixed(1) });
  if (typeof s.earnings === 'number' && s.earnings > 0)
    cards.push({ key: 'earnings', label: t('player.season.card.earnings'), value: formatEarnings(s.earnings) });
  return cards;
}

function fromResults(r: PlayerTournamentResult[], t: TFunction): Card[] {
  const cards: Card[] = [];
  if (r.length > 0) cards.push({ key: 'events', label: t('player.season.card.events'), value: String(r.length) });

  const finishes = r
    .filter((x) => {
      const st = x.status?.toUpperCase();
      return typeof x.position === 'number' && st !== 'WD' && st !== 'CUT' && st !== 'MC' && st !== 'DQ';
    })
    .map((x) => x.position as number)
    .sort((a, b) => a - b);
  if (finishes.length > 0) {
    const best = finishes[0];
    cards.push({ key: 'best', label: t('player.season.card.bestFinish'), value: best === 1 ? '1' : `T${best}` });
  }

  const madeCuts = r.filter((x) => {
    const st = x.status?.toUpperCase();
    return st !== 'CUT' && st !== 'MC' && st !== 'WD' && st !== 'DQ' && x.position !== null;
  }).length;
  if (madeCuts > 0) cards.push({ key: 'cuts', label: t('player.season.card.madeCuts'), value: String(madeCuts) });

  return cards;
}

export function SeasonCards({ playerStats, results, player }: SeasonCardsProps) {
  const { t } = useTranslation('tourhub');
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasStats = !!playerStats;
  const cards = hasStats ? fromStats(playerStats!, t) : fromResults(results, t);

  if (cards.length === 0) return null;

  const openSheet = () => {
    setSheetOpen(true);
    void analyticsEvents.track('tour_player_stats_opened', { player_id: player.id });
  };

  return (
    <section style={{ background: SLATE_50, padding: '16px 0 14px' }}>
      {/* Kicker row */}
      <div
        style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: INK,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {t('player.season.eyebrow')}
        </p>
        {hasStats && (
          <button
            type="button"
            onClick={openSheet}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              // CAPS button: two points below the floor, 0.10em.
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: INK,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            className="active:opacity-60 transition-opacity"
          >
            {t('player.season.allStats')}
            <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>
              {'\u203a'}
            </span>
          </button>
        )}
      </div>

      {/* Stat group */}
      <div
        style={{
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`,
          gap: 8,
        }}
      >
        {cards.map((c) => (
          <div key={c.key} style={{ minWidth: 0, textAlign: 'center' as const }}>
            <div
              style={{
                // Stat labels (TOP 10S, WINS, SCORING, EARNINGS) — READ 11.
                fontSize: 11,
                fontWeight: 700,
                color: INK_FAINT,
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: INK,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {hasStats && (
        <StatsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          playerStats={playerStats!}
          playerName={player.full_name}
          tour={mapTourSlug(player.tour_codes?.[0] ?? 'pga')}
        />
      )}
    </section>
  );
}
