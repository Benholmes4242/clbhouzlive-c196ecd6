// WARNING: this file uses var(--hcp-*) tokens, which resolve ONLY
// inside the .hcp-dark page scope. NEVER render these atoms inside
// a portalled bottom sheet — tokens resolve to nothing there and
// text goes invisible. For sheet-rendered UI, use literal-based
// equivalents (see the portal rule in the palette canon).
import React from 'react';

/**
 * Handicap Dashboard — Dark-Mode Shared Atoms
 * ===========================================
 *
 * Primitives composed by every dark-zone section. They reference the
 * CSS variables defined in `src/styles/handicap-dark.css` (`--hcp-*`),
 * which only resolve inside a `.hcp-dark` ancestor.
 *
 * Why these exist:
 *   1. One source of truth for the eyebrow / section header pattern
 *   2. Verdict colour is enforced by VerdictNumber, not eye-balled
 *   3. Card, KPICell, Pill all share spacing + line tokens
 *
 * Light-mode counterparts already live in `_shared/atoms.tsx`. These
 * are the dark siblings; they're intentionally additive, never an
 * override of the light atoms.
 */

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * DARK_ROW_TITLE — the identity line of a dark row or card.
 *
 * ONE definition, shared by the record name (Records to break) and the
 * course name (Your courses). Two sections that are meant to match will
 * drift the moment either is touched, so never copy these numbers.
 */
export const DARK_ROW_TITLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: 'var(--hcp-t-100)',
  lineHeight: 1.3,
};


// ── Type guards ────────────────────────────────────────────────────

export type Verdict = 'good' | 'bad' | 'mid' | 'neutral';

/**
 * Pick the verdict for an index/score-diff delta.
 * Lower-is-better metrics (handicap diff, index): negative = good.
 * @param delta the change value
 * @param invert pass true when higher-is-better (e.g. stableford pts)
 */
export function verdictForDelta(
  delta: number | null | undefined,
  invert = false,
): Verdict {
  if (delta == null || Number.isNaN(delta)) return 'neutral';
  if (delta === 0) return 'mid';
  const isPositive = delta > 0;
  if (invert) return isPositive ? 'good' : 'bad';
  return isPositive ? 'bad' : 'good';
}

// ── Section header (dark shim over canonical SectionHeader) ───────
//
// Path A (convergence): DarkSectionHeader is now a thin adapter that
// renders SectionHeader with `surface="dark"`. Geometry is therefore
// identical to light surfaces (11px/0.14em/800 eyebrow, 20px title,
// 22×2 amber cut-line). Eyebrow & title colours pull from --hcp-*
// tokens so they remain legible on the charcoal surface.
//
// Prop mapping (legacy → canonical):
//   eyebrow → kicker
//   right   → meta (non-interactive right-aligned caps text)
//   title, sub → passthrough
//   withDot → no-op (unused at callsites; legacy amber-bullet kept
//             out of canonical to preserve geometry parity)

import { SectionHeader } from '@/components/ui/SectionHeader';

export interface DarkSectionHeaderProps {
  eyebrow: string;
  title?: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
  /** @deprecated no-op under the canonical shim; retained for API compat. */
  withDot?: boolean;
}

export const DarkSectionHeader: React.FC<DarkSectionHeaderProps> = ({
  eyebrow,
  title,
  sub,
  right,
}) => (
  <SectionHeader
    surface="dark"
    role="section"
    kicker={eyebrow}
    title={typeof title === 'string' ? title : title ? String(title) : undefined}
    sub={sub}
    meta={right}
    paddingTop={22}
    paddingX={16}
  />
);

// ── Card wrapper ───────────────────────────────────────────────────

export interface DarkCardProps {
  children: React.ReactNode;
  /** Adds a subtle accent rail on the left edge (used by Next Round Watch) */
  accent?: 'good' | 'bad' | 'amber' | 'none';
  /** Adds a soft radial glow at the top of the card */
  glow?: 'good' | 'cold' | 'amber' | 'none';
  /** Override default margin */
  style?: React.CSSProperties;
  /** Optional class hook */
  className?: string;
}

export const DarkCard: React.FC<DarkCardProps> = ({
  children,
  accent = 'none',
  glow = 'none',
  style,
  className,
}) => {
  const accentColor =
    accent === 'good' ? 'var(--hcp-good)' :
    accent === 'bad'  ? 'var(--hcp-bad)' :
    accent === 'amber'? 'var(--hcp-amber)' : null;

  const glowStop =
    glow === 'good'  ? 'rgba(52,211,153,0.06)' :
    glow === 'cold'  ? 'rgba(56, 189, 248, 0.10)' :
    glow === 'amber' ? 'rgba(247, 147, 30, 0.10)' : null;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        margin: '0 16px',
        background: glowStop
          ? `linear-gradient(180deg, ${glowStop} 0%, transparent 60%), var(--hcp-bg-1)`
          : 'var(--hcp-bg-1)',
        border: accent !== 'none'
          ? '1px solid var(--hcp-line-2)'
          : '1px solid var(--hcp-line)',
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: FONT,
        ...style,
      }}
    >
      {accentColor && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: `linear-gradient(180deg, ${accentColor}, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

// ── KPI cell (used in triple-strip and elsewhere) ──────────────────

export interface KPICellProps {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  /** Verdict colour for the value */
  verdict?: Verdict | 'warm' | 'cold';
  /** Vertical or horizontal layout */
  layout?: 'centered' | 'stacked';
}

export const KPICell: React.FC<KPICellProps> = ({
  label,
  value,
  meta,
  verdict = 'neutral',
  layout = 'centered',
}) => {
  const valueColor =
    verdict === 'good' ? 'var(--hcp-good)' :
    verdict === 'bad'  ? 'var(--hcp-bad)' :
    verdict === 'mid'  ? 'var(--hcp-mid)' :
    verdict === 'warm' ? 'var(--hcp-amber)' :
    verdict === 'cold' ? 'var(--hcp-cold)' :
    'var(--hcp-t-100)';

  return (
    <div
      style={{
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: layout === 'centered' ? 'center' : 'flex-start',
        justifyContent: 'center',
        gap: 6,
        textAlign: layout === 'centered' ? 'center' : 'left',
        fontFamily: FONT,
      }}
    >
      <span
        style={{
          textTransform: 'uppercase',
          fontSize: 9.5,
          letterSpacing: '0.16em',
          fontWeight: 700,
          color: 'var(--hcp-t-60)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: valueColor,
        }}
      >
        {value}
      </span>
      {meta && (
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--hcp-t-40)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {meta}
        </span>
      )}
    </div>
  );
};

// ── Triple-strip (3 KPICells in a row, used under hero rings) ──────

export const TripleStrip: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  /**
   * 'card' (default): boxed with bg, border, and rounded corners
   * 'flush': no card wrapper; cells sit directly on canvas with
   *          hairline dividers and a hairline above/below the row.
   */
  variant?: 'card' | 'flush';
}> = ({ children, style, variant = 'card' }) => {
  const count = React.Children.count(children);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${count || 1}, 1fr)`,
        margin: variant === 'flush' ? '20px 20px 0' : '16px 20px 0',
        background: variant === 'flush' ? 'transparent' : 'var(--hcp-bg-1)',
        border: variant === 'flush' ? 'none' : '1px solid var(--hcp-line)',
        borderTop: variant === 'flush' ? '1px solid var(--hcp-line)' : undefined,
        borderBottom: variant === 'flush' ? '1px solid var(--hcp-line)' : undefined,
        borderRadius: variant === 'flush' ? 0 : 14,
        overflow: 'hidden',
        ...style,
      }}
    >
      {React.Children.map(children, (child, i) => (
        <div
          style={{
            borderLeft: i > 0 ? '1px solid var(--hcp-line)' : 'none',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// ── Verdict number (auto-coloured by sign) ─────────────────────────

export interface VerdictNumberProps {
  value: number | null | undefined;
  /** Add explicit + sign for positives */
  showSign?: boolean;
  /** Lower-is-better (handicap diff). Flip with `invert` for stableford etc. */
  invert?: boolean;
  /** Decimal places */
  digits?: number;
  /** Override verdict (rare — use only when delta itself isn't the signal) */
  forceVerdict?: Verdict;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Inline style extension */
  style?: React.CSSProperties;
}

export const VerdictNumber: React.FC<VerdictNumberProps> = ({
  value,
  showSign = false,
  invert = false,
  digits = 1,
  forceVerdict,
  size = 'md',
  style,
}) => {
  if (value == null || Number.isNaN(value)) {
    return <span style={style}>—</span>;
  }
  const v = forceVerdict ?? verdictForDelta(value, invert);
  const color =
    v === 'good' ? 'var(--hcp-good)' :
    v === 'bad'  ? 'var(--hcp-bad)' :
    v === 'mid'  ? 'var(--hcp-mid)' :
    'var(--hcp-t-100)';
  const fontSize =
    size === 'sm' ? 14 :
    size === 'md' ? 18 :
    size === 'lg' ? 24 : 32;
  const sign = showSign && value > 0 ? '+' : '';
  return (
    <span
      style={{
        color,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums lining-nums',
        fontSize,
        ...style,
      }}
    >
      {sign}{value.toFixed(digits)}
    </span>
  );
};

// ── Verdict pill (small badge) ─────────────────────────────────────

export interface VerdictPillProps {
  children: React.ReactNode;
  verdict?: Verdict;
}

export const VerdictPill: React.FC<VerdictPillProps> = ({ children, verdict = 'neutral' }) => {
  const bg =
    verdict === 'good' ? 'var(--hcp-good-tint)' :
    verdict === 'bad'  ? 'var(--hcp-bad-tint)' :
    verdict === 'mid'  ? 'var(--hcp-mid-tint)' :
    'var(--hcp-bg-3)';
  const color =
    verdict === 'good' ? 'var(--hcp-good)' :
    verdict === 'bad'  ? 'var(--hcp-bad-2)' :
    verdict === 'mid'  ? 'var(--hcp-mid)' :
    'var(--hcp-t-60)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        background: bg,
        color,
        textTransform: 'uppercase',
        fontSize: 9.5,
        letterSpacing: '0.14em',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {children}
    </span>
  );
};

// ── Live status row (the topbar "LIVE · synced Xm ago") ────────────

export interface LiveStatusProps {
  status: 'live' | 'syncing' | 'stale' | 'offline';
  /** e.g. "4M AGO" — already-formatted relative time */
  syncedAgo?: string;
}

export const LiveStatus: React.FC<LiveStatusProps> = ({ status, syncedAgo }) => {
  const dotColor =
    status === 'live'    ? 'var(--hcp-good)' :
    status === 'syncing' ? 'var(--hcp-amber)' :
    status === 'stale'   ? 'var(--hcp-mid)' :
    'var(--hcp-t-40)';
  const labelColor =
    status === 'live'    ? 'var(--hcp-good)' :
    status === 'syncing' ? 'var(--hcp-amber)' :
    'var(--hcp-t-60)';
  const label =
    status === 'live'    ? 'LIVE' :
    status === 'syncing' ? 'SYNCING' :
    status === 'stale'   ? 'STALE' : 'OFFLINE';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONT,
      }}
    >
      <span
        className={status === 'live' ? 'hcp-live-dot' : undefined}
        style={status !== 'live' ? {
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
        } : undefined}
      />
      <span
        style={{
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: '0.18em',
          fontWeight: 700,
          color: 'var(--hcp-t-60)',
        }}
      >
        <span style={{ color: labelColor, fontWeight: 700 }}>{label}</span>
        {syncedAgo && (
          <>
            <span style={{ color: 'var(--hcp-t-40)' }}> · SYNCED {syncedAgo}</span>
          </>
        )}
      </span>
    </span>
  );
};
