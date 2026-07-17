/**
 * SeasonCards — "This Season" grid of four stat cards.
 *
 * When useSinglePlayerStatistics has a row: TOP 10s / WINS / SCORING /
 * EARNINGS + 'All stats >' opens the StatsSheet. When the row is
 * missing (euro/LPGA sync gaps): derive EVENTS / BEST FINISH /
 * MADE CUTS from the leaderboard rows and drop the sheet action.
 * Per-field null discipline: cards with no derivable value are
 * omitted rather than shown as dashes.
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { StatsSheet } from '../StatsSheet';
import { formatCurrencyUsd } from '@/i18n/format';
import {
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  INK_TINT_07,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

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

function fmtCompactMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return formatCurrencyUsd(n);
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
    cards.push({ key: 'earnings', label: t('player.season.card.earnings'), value: fmtCompactMoney(s.earnings) });
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

  return (
    <section
      style={{
        background: SLATE_50,
        padding: '16px 0 14px',
        borderTop: `0.5px solid ${INK_TINT_07}`,
      }}
    >
      {/* Eyebrow row */}
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
            fontSize: 10,
            fontWeight: 800,
            color: INK_FAINT,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {t('player.season.eyebrow')}
        </p>
        {hasStats && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 11,
              fontWeight: 800,
              color: INK,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              letterSpacing: '-0.005em',
            }}
            className="active:opacity-60 transition-opacity"
          >
            All stats
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Card grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: 8 }}>
        {cards.map((c) => (
          <div
            key={c.key}
            style={{
              background: SURFACE,
              borderRadius: 12,
              padding: '12px 10px 12px',
              border: `0.5px solid ${HAIRLINE_INK_8}`,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 19,
                fontWeight: 200,
                letterSpacing: '-0.02em',
                color: INK,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 8.5,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.14em',
              }}
            >
              {c.label}
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
        />
      )}
    </section>
  );
}
