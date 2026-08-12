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

const INK = 'var(--hcp-t-100)';
const INK_55 = 'var(--hcp-t-60)';
const INK_10 = 'var(--hcp-line-2)';
const AMBER_INK = '#C97211';
const GREEN_DEEP = '#15803D';
const GREEN_SOFT = 'rgba(52,211,153,0.12)';
const RED_INK = '#EF4444';
const RED_SOFT = 'rgba(239,68,68,0.10)';
const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
   * Whether the round counts toward the user's handicap index. Counting
   * rounds render with a green ring around the gross score; non-counting
   * rounds render plain.
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
        padding: '8px 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontFamily: FONT_SF,
        background: 'var(--hcp-bg-1)',
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
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
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
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.05em',
                lineHeight: 0.85,
                fontVariantNumeric: 'tabular-nums lining-nums',
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
                  fontVariantNumeric: 'tabular-nums lining-nums',
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
            paddingBottom: 6,
          }}
        >
          {stableford != null && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--hcp-t-60)',
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
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums lining-nums',
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
                fontWeight: 700,
                letterSpacing: '0.04em',
                fontVariantNumeric: 'tabular-nums lining-nums',
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
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
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
                  background: 'var(--hcp-bg-3)',
                  border: '1px solid var(--hcp-line-2)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
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
        border: '1px solid var(--hcp-line-2)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--hcp-bg-1)',
        textAlign: 'left',
        fontFamily: FONT_SF,
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
