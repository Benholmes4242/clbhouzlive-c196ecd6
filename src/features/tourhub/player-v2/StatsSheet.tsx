/**
 * StatsSheet — one-scroll canvas replacing the old four-tab statistics
 * page. Uses the house BottomSheet, 90vh cap. Sub-sections:
 * OVERVIEW / BALL STRIKING / SHORT GAME / STROKES GAINED. Every field
 * checks for null and omits its row; a sub-section with all-null fields
 * omits entirely.
 */

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { TourPlayerStatistics } from '../hooks/useTourHubData';
import {
  AMBER,
  HAIRLINE_INK_8,
  HAIRLINE_INK_15,
  INK,
  INK_FAINT,
  INK_MUTE,
  INK_TINT_07,
  SURFACE,
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
  return `$${v.toLocaleString()}`;
}

interface Row {
  label: string;
  value: string;
}

function Cell({ row }: { row: Row }) {
  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: `0.5px solid ${INK_TINT_07}`,
      }}
    >
      <div
        style={{
          fontSize: 8,
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
    <div style={{ marginTop: 22 }}>
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 8.5,
          fontWeight: 800,
          color: INK_FAINT,
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
    <div style={{ padding: '11px 0', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span
          style={{
            fontSize: 8,
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
  // OVERVIEW
  const overview: Row[] = [];
  const push = (label: string, v: string | null) => {
    if (v !== null) overview.push({ label, value: v });
  };
  push('Events Played', fmtInt(playerStats.events_played));
  push('Wins', fmtInt(playerStats.wins));
  push('Top 10s', fmtInt(playerStats.top_10s));
  push('Top 25s', fmtInt(playerStats.top_25s));
  push('Cuts Made', fmtInt(playerStats.cuts_made));
  push('Earnings', fmtMoney(playerStats.earnings));
  push('Scoring Avg', fmtDecimal(playerStats.scoring_average, 2));
  push('Birdies / Rd', fmtDecimal(playerStats.birdies_per_round, 2));

  // BALL STRIKING
  const ball: Row[] = [];
  const pushBall = (label: string, v: string | null) => {
    if (v !== null) ball.push({ label, value: v });
  };
  pushBall('Driving Dist', fmtYards(playerStats.driving_distance));
  pushBall('Driving Acc', fmtPct(playerStats.driving_accuracy));
  pushBall('GIR', fmtPct(playerStats.greens_in_reg));

  // SHORT GAME
  const shortGame: Row[] = [];
  const pushShort = (label: string, v: string | null) => {
    if (v !== null) shortGame.push({ label, value: v });
  };
  pushShort('Scrambling', fmtPct(playerStats.scrambling));
  pushShort('Putting Avg', fmtDecimal(playerStats.putting_average, 3));

  const hasSG =
    playerStats.strokes_gained_total !== null ||
    playerStats.strokes_gained_tee_green !== null ||
    playerStats.strokes_gained !== null;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="stats-sheet-title">
      <div
        style={{
          padding: '4px 20px 24px',
          background: SURFACE,
          maxHeight: 'calc(90vh - 20px)',
          overflowY: 'auto',
        }}
      >
        <h2
          id="stats-sheet-title"
          style={{
            margin: '4px 0 2px',
            fontSize: 20,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
          }}
        >
          {playerName}
        </h2>
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
          Season Statistics
        </p>

        <SubSection label="Overview" rows={overview} />
        <SubSection label="Ball Striking" rows={ball} />
        <SubSection label="Short Game" rows={shortGame} />

        {hasSG && (
          <div style={{ marginTop: 22 }}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 8.5,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Strokes Gained
            </p>
            <SGBar label="SG: Total" value={playerStats.strokes_gained_total} />
            <SGBar label="SG: Tee to Green" value={playerStats.strokes_gained_tee_green} />
            <SGBar label="SG: Around Green" value={playerStats.strokes_gained} />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
