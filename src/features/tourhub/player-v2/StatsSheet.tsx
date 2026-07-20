/**
 * StatsSheet — one-scroll canvas replacing the old four-tab statistics
 * page. Uses the house BottomSheet, 90vh cap. Sub-sections:
 * OVERVIEW / BALL STRIKING / SHORT GAME / STROKES GAINED. Every field
 * checks for null and omits its row; a sub-section with all-null fields
 * omits entirely.
 */

import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { TourPlayerStatistics } from '../hooks/useTourHubData';
import { formatCurrencyUsd } from '@/i18n/format';
import { LEADER_STAT_LABELS } from '../leaders-v2/data/useLeaderCategories';
import {
  AMBER,
  HAIRLINE_INK_8,
  HAIRLINE_INK_15,
  INK,
  INK_FAINT,
  INK_MUTE,
  INK_TINT_07,
  SLATE_50,
} from '../_shared/tokens';

interface StatsSheetProps {
  open: boolean;
  onClose: () => void;
  playerStats: TourPlayerStatistics;
  playerName: string;
}

function fmtInt(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}
function fmtDecimal(v: number | null | undefined, d = 2): string | null {
  if (v === null || v === undefined) return null;
  return v.toFixed(d);
}
function fmtPct(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return `${v.toFixed(1)}%`;
}
function fmtYards(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return `${v.toFixed(1)} yds`;
}
function fmtMoney(v: number | null | undefined): string | null {
  if (v === null || v === undefined || v <= 0) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  return formatCurrencyUsd(v);
}

interface Row {
  label: string;
  value: string;
}

function Cell({ row }: { row: Row }) {
  return (
    <div
      style={{
        padding: '8px 0',
        borderBottom: `0.5px solid ${INK_TINT_07}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {row.label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.005em',
        }}
      >
        {row.value}
      </div>
    </div>
  );
}

function SubSection({ label, rows }: { label: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 10,
          fontWeight: 800,
          color: AMBER,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
        {rows.map((r) => (
          <Cell key={r.label} row={r} />
        ))}
      </div>
    </div>
  );
}

function SGBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const barPct = Math.min(50, (Math.abs(value) / 3.0) * 50);
  const isPositive = value >= 0;
  const formatted =
    value === 0 ? '0.00' : value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  return (
    <div style={{ padding: '12px 0', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: INK_MUTE,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatted}
        </span>
      </div>
      <div style={{ position: 'relative', height: 4, borderRadius: 2, background: HAIRLINE_INK_8 }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: HAIRLINE_INK_15,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            borderRadius: 2,
            background: isPositive ? AMBER : INK_FAINT,
            left: isPositive ? '50%' : `${50 - barPct}%`,
            width: `${barPct}%`,
          }}
        />
      </div>
    </div>
  );
}

export function StatsSheet({ open, onClose, playerStats, playerName }: StatsSheetProps) {
  const { t } = useTranslation('tourhub');
  const label = (key: keyof typeof LEADER_STAT_LABELS) => t(LEADER_STAT_LABELS[key].shortKey);

  // OVERVIEW
  const overview: Row[] = [];
  const push = (l: string, v: string | null) => {
    if (v !== null) overview.push({ label: l, value: v });
  };
  push(label('events_played'), fmtInt(playerStats.events_played));
  push(label('wins'), fmtInt(playerStats.wins));
  push(label('top_10'), fmtInt(playerStats.top_10s));
  push(label('top_25'), fmtInt(playerStats.top_25s));
  push(label('cuts_made'), fmtInt(playerStats.cuts_made));
  push(label('earnings'), fmtMoney(playerStats.earnings));
  push(label('scoring_avg'), fmtDecimal(playerStats.scoring_average, 2));
  push(label('birdies_per_round'), fmtDecimal(playerStats.birdies_per_round, 2));

  // BALL STRIKING
  const ball: Row[] = [];
  const pushBall = (l: string, v: string | null) => {
    if (v !== null) ball.push({ label: l, value: v });
  };
  pushBall(label('drive_avg'), fmtYards(playerStats.driving_distance));
  pushBall(label('drive_acc'), fmtPct(playerStats.driving_accuracy));
  pushBall(label('gir_pct'), fmtPct(playerStats.greens_in_reg));

  // SHORT GAME
  const shortGame: Row[] = [];
  const pushShort = (l: string, v: string | null) => {
    if (v !== null) shortGame.push({ label: l, value: v });
  };
  pushShort(label('scrambling'), fmtPct(playerStats.scrambling));
  pushShort(label('putt_avg'), fmtDecimal(playerStats.putting_average, 3));

  const hasSG =
    playerStats.strokes_gained_total !== null ||
    playerStats.strokes_gained_tee_green !== null ||
    playerStats.strokes_gained !== null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="stats-sheet-title"
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        background: SLATE_50,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          background: SLATE_50,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '4px 16px 8px',
          }}
        >
          <p
            style={{
              margin: '4px 0 4px',
              fontSize: 10,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {t('player.stats.eyebrow')}
          </p>
          <h2
            id="stats-sheet-title"
            style={{
              margin: '0 0 2px',
              fontSize: 20,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
            }}
          >
            {playerName}
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 16px 24px',
          }}
        >
          <SubSection label={t('player.stats.section.overview')} rows={overview} />
          <SubSection label={t('player.stats.section.ballStriking')} rows={ball} />
          <SubSection label={t('player.stats.section.shortGame')} rows={shortGame} />

          {hasSG && (
            <div style={{ marginTop: 24 }}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 800,
                  color: AMBER,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {t('player.stats.section.strokesGained')}
              </p>
              <SGBar label={t(LEADER_STAT_LABELS.strokes_gained_total.shortKey)} value={playerStats.strokes_gained_total} />
              <SGBar label={t(LEADER_STAT_LABELS.strokes_gained_tee_green.shortKey)} value={playerStats.strokes_gained_tee_green} />
              <SGBar label={t(LEADER_STAT_LABELS.strokes_gained_around_green.shortKey)} value={playerStats.strokes_gained} />
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
