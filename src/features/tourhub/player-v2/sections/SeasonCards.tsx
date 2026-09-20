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
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { StatsSheet } from '../StatsSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { mapTourSlug } from '../../_shared/tourOrder';
import { INK, INK_FAINT, SLATE_50 } from '../../_shared/tokens';
import type { PlayerSeasonSelection } from '../playerSeason';
import { playerOrdinal } from '../playerOrdinal';
import { isFinish, isNonStarter } from '../../_shared/resultStatus';
import { formatPositionShort } from '../../hooks/usePlayerResults';

interface SeasonCardsProps {
  playerStats: TourPlayerStatistics | null;
  results: PlayerTournamentResult[];
  player: TourPlayer;
  selection: PlayerSeasonSelection;
}

export function SeasonCards({ playerStats, results, player, selection }: SeasonCardsProps) {
  const { t } = useTranslation('tourhub');
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasStats = !!playerStats;
  // sr_leaderboards.status is stored UPPER CASE throughout — the full vocabulary
  // is CUT / MC / MDF / WD / DQ / DNS, and every comparison must upper-case its
  // input. Compare only through _shared/resultStatus.ts, which also records why
  // MDF counts as a made cut here and is demoted on the leaderboard.
  const entered = results.filter((result) => !isNonStarter(result.status));
  const best = entered
    .filter((result) => result.position != null && isFinish(result.status))
    .sort((a, b) => (a.position ?? Number.POSITIVE_INFINITY) - (b.position ?? Number.POSITIVE_INFINITY))[0];
  const derivedCuts = entered.filter((result) => isFinish(result.status) && result.position != null).length;
  const counts = playerStats
    ? [
        { key: 'events', label: t('player.season.card.events'), value: playerStats.events_played ?? results.length },
        { key: 'wins', label: t('player.season.card.wins'), value: playerStats.wins },
        { key: 'top10', label: t('player.season.card.top10s'), value: playerStats.top_10s },
        { key: 'cuts', label: t('player.season.card.madeCuts'), value: playerStats.cuts_made },
      ].filter((item) => typeof item.value === 'number').slice(0, 4)
    : [
        { key: 'events', label: t('player.season.card.events'), value: entered.length },
        { key: 'best', label: t('player.season.card.bestFinish'), value: best ? formatPositionShort(best.position, best.position_tied, best.status) : null },
        { key: 'cuts', label: t('player.season.card.madeCuts'), value: derivedCuts },
      ].filter((item) => item.value != null);
  if (!selection.headline && counts.length === 0) return null;

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

      {selection.headline && (
        <div style={{ padding: '2px 16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK_FAINT }}>{selection.headline.label}</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 46, lineHeight: 0.95, fontWeight: 760, color: INK, fontVariantNumeric: 'tabular-nums lining-nums' }}>{selection.headline.valueFormatted}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: INK_FAINT }}>{playerOrdinal(t, selection.headline)}</span>
          </div>
        </div>
      )}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(counts.length, 1)}, 1fr)`, gap: 8 }}>
        {counts.map((c) => (
          <div key={c.key} style={{ minWidth: 0 }}>
            <div
              style={{
                // Stat labels (TOP 10S, WINS, SCORING, EARNINGS) — READ 11.
                fontSize: 10,
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
                marginTop: 5,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: INK,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {String(c.value)}
            </div>
          </div>
        ))}
      </div>

      {hasStats && (
        <StatsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          playerStats={playerStats}
          playerName={player.full_name}
          tour={mapTourSlug(player.tour_codes?.[0] ?? 'pga')}
        />
      )}
    </section>
  );
}
