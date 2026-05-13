/**
 * RoundCardShell — shared chrome for round-summary cards.
 *
 * Renders:
 *   - 16:4 banner with optional photo + 3-stop top→bottom scrim
 *   - Custom banner content (caller decides — course header, or pill+player)
 *   - White body with eyebrow context line, GROSS / DIFF / STABLEFORD / HCP delta row
 *   - Optional hole-by-hole strip with "View scorecard" affordance
 */
import React from 'react';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { RoundCardHoleStrip, type HoleRow } from './RoundCardHoleStrip';

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_10 = 'rgba(15,23,42,0.10)';
const AMBER_INK = '#C97211';
const GREEN_DEEP = '#15803D';
const GREEN_SOFT = 'rgba(34,197,94,0.12)';
const RED_INK = '#991B1B';
const RED_SOFT = 'rgba(220,38,38,0.10)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const fmtDiff = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

export interface RoundCardBodyProps {
  /** Gross score — required. */
  gross: number | null;
  /** Differential, e.g. -2.1 → "−2.1 DIFF" below gross. Null hides the strip. */
  differential: number | null;
  /** Stableford points. Null hides the cell. */
  stableford: number | null;
  /** HCP index delta, e.g. -0.1 → green pill ↓0.1. Null/abs<0.05 hides the pill. */
  handicapDelta: number | null;
  /**
   * Whether the round was a counter (entered the user's best-8). Non-counters
   * mathematically cannot move the index, so the HCP pill is suppressed for
   * them even when handicapDelta is non-null.
   */
  isCounter: boolean;
  /** Hole-by-hole data. If absent, the strip block is omitted. */
  holes?: HoleRow[] | null;
  /** Whether to show "View scorecard" chip in the strip block. Default true if holes present. */
  showViewScorecard?: boolean;
  /** Tap handler — fires on card or "View scorecard" chip. */
  onClick: () => void;
}

export interface RoundCardShellProps extends RoundCardBodyProps {
  /** Course thumbnail URL — fallback gradient is applied if absent. */
  courseThumbnailUrl?: string | null;
  /** Banner content (the caller decides what goes here — course title, or pill+player). */
  banner: React.ReactNode;
}

const _RoundCardBody: React.FC<RoundCardBodyProps> = ({
  gross,
  differential,
  stableford,
  handicapDelta,
  isCounter,
  holes,
  showViewScorecard = true,
  onClick,
}) => {
  const showHcp =
    isCounter && handicapDelta != null && Math.abs(handicapDelta) >= 0.05;
  const hcpIsCut = showHcp && handicapDelta! < 0;
  const hcpColor = hcpIsCut ? GREEN_DEEP : RED_INK;
  const hcpBg = hcpIsCut ? GREEN_SOFT : RED_SOFT;
  const hcpMag = showHcp ? Math.abs(handicapDelta!).toFixed(1) : null;

  return (
    <div
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT_GEIST,
        background: '#fff',
      }}
    >
      {/* Hero row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            GROSS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 56,
                fontWeight: 200,
                color: INK,
                letterSpacing: '-0.05em',
                lineHeight: 0.85,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {gross ?? '\u2014'}
            </span>
            {differential != null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: AMBER_INK,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontVariantNumeric: 'tabular-nums',
                  paddingBottom: 6,
                }}
              >
                {fmtDiff(differential)} DIFF
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          {stableford != null && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_55,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                STABLEFORD
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stableford}
              </div>
            </div>
          )}
          {showHcp && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 999,
                background: hcpBg,
                color: hcpColor,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hcpIsCut
                ? <TrendingDown size={11} color={hcpColor} strokeWidth={2.6} />
                : <TrendingUp size={11} color={hcpColor} strokeWidth={2.6} />}
              {hcpMag}
            </span>
          )}
        </div>
      </div>

      {/* Hole strip */}
      {holes && holes.length > 0 && (
        <div style={{ borderTop: `0.5px solid ${INK_10}`, paddingTop: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: INK_55,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              HOLE BY HOLE
            </span>
            {showViewScorecard && (
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 8px 4px 12px',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.06)',
                  border: `0.5px solid ${INK_10}`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                View scorecard
                <ChevronRight size={11} strokeWidth={2.6} />
              </span>
            )}
          </div>
          <RoundCardHoleStrip holes={holes} />
        </div>
      )}
    </div>
  );
};

export const RoundCardBody = _RoundCardBody;

export const RoundCardShell: React.FC<RoundCardShellProps> = ({
  courseThumbnailUrl,
  banner,
  onClick,
  ...bodyProps
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        margin: 0,
        padding: 0,
        border: `0.5px solid ${INK_10}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#fff',
        textAlign: 'left',
        fontFamily: FONT_GEIST,
      }}
    >
      {/* Banner */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 4',
          background: courseThumbnailUrl
            ? `url(${courseThumbnailUrl}) center/cover`
            : 'linear-gradient(135deg, #1f2937, #0f172a)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {banner}
      </div>

      <_RoundCardBody {...bodyProps} onClick={onClick} />
    </button>
  );
};
