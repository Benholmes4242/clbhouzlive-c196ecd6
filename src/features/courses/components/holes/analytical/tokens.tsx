/**
 * Analytical treatment tokens + primitives for the Course tab
 * (BRIEF_COURSE_TAB_ANALYTICAL_TREATMENT).
 *
 * Rules encoded here:
 *   - no internal divider lines; separation is a panel edge or whitespace
 *   - figures use the app sans stack with tabular-nums lining (NOT a
 *     monospace face - Menlo / SF Mono / Consolas slash the zero by default
 *     and `font-feature-settings: "zero" 0` cannot switch that off)
 *   - colour means exactly three things: over par, under par, you
 *   - signed values round FIRST, then branch, so -0.04 never renders "-0.0"
 *   - absent values render nothing (no placeholder dashes)
 */
import React from 'react';

export const A = {
  CANVAS: '#F4F6F9',
  PANEL: '#FFFFFF',
  BORDER: '#EDF0F3',
  INK: '#0E1216',
  MUTE: '#68707B',
  DIM: '#A2A9B2',
  AMBER: '#F7931E',
  AMBER_DEEP: '#C2620A',
  RED: '#C8372B',
  GREEN: '#0F8F4A',
  TRACK: '#E9EDF1',
} as const;

export const SANS = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

/** Tabular figures WITHOUT a monospace face - this is what removes the slash. */
export const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining' };

export const NUM: React.CSSProperties = {
  fontFamily: SANS,
  letterSpacing: '-0.02em',
  fontWeight: 800,
  ...FIGS,
};

export const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.DIM,
};

export const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: A.AMBER_DEEP,
};

export const TITLE: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: A.INK };

export interface ToParParts { text: string; tone: string }

/**
 * Round first, then branch on the rounded value.
 * Returns null when there is nothing to show - callers render nothing.
 */
export function toParParts(v: number | null | undefined, digits = 1): ToParParts | null {
  if (v == null || !Number.isFinite(v)) return null;
  const f = Math.pow(10, digits);
  const r = Math.round(v * f) / f;
  if (r > 0) return { text: `+${r.toFixed(digits)}`, tone: A.RED };
  if (r < 0) return { text: `\u2212${Math.abs(r).toFixed(digits)}`, tone: A.GREEN };
  return { text: 'E', tone: A.INK };
}

export const Panel: React.FC<{
  kicker?: string;
  /** Panel-level heading (13/800 INK). Used where a panel titles itself. */
  title?: string;
  aside?: string;
  footer?: string;
  onOpen?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ kicker, title, aside, footer, onOpen, children, style }) => (
  <section
    style={{
      background: A.PANEL,
      border: `1px solid ${A.BORDER}`,
      borderRadius: 16,
      padding: 16,
      fontFamily: SANS,
      ...FIGS,
      ...style,
    }}
  >
    {(kicker || title || aside) && (
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {kicker && <span style={KICKER}>{kicker}</span>}
        {title && !kicker && <span style={TITLE}>{title}</span>}
        {aside && <span style={{ ...LABEL, textAlign: 'right' }}>{aside}</span>}
      </header>
    )}
    {children}
    {footer && (
      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: 8,
          width: '100%',
          minHeight: 32,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: 0,
          fontFamily: SANS,
        }}
      >
        <span style={{ ...LABEL, color: A.AMBER_DEEP }}>{footer}</span>
        <span style={{ fontSize: 12, color: A.AMBER_DEEP, fontWeight: 800 }} aria-hidden="true">
          {'\u203A'}
        </span>
      </button>
    )}
  </section>
);

export interface StatItem { label: string; value: React.ReactNode; tone?: string; sub?: string }

export const StatRow: React.FC<{
  items: StatItem[];
  size?: number;
  style?: React.CSSProperties;
}> = ({ items, size = 22, style }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      ...style,
    }}
  >
    {items.map((it) => (
      <div key={it.label} style={{ textAlign: 'center', minWidth: 0 }}>
        <div style={LABEL}>{it.label}</div>
        <div style={{ ...NUM, fontSize: size, color: it.tone ?? A.INK, marginTop: 4, whiteSpace: 'nowrap' }}>
          {it.value}
        </div>
        {it.sub ? (
          <div
            style={{
              ...LABEL,
              fontSize: 8,
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {it.sub}
          </div>
        ) : null}
      </div>
    ))}
  </div>
);


/**
 * Quiet uppercase text affordance shared by the lower Course-tab blocks.
 * Never a filled pill - the analytical treatment has no tinted buttons.
 */
export const Action: React.FC<{
  label: string;
  onClick: () => void;
  align?: 'left' | 'center';
  tone?: string;
  style?: React.CSSProperties;
}> = ({ label, onClick, align = 'center', tone = A.AMBER_DEEP, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      minHeight: 32,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 6,
      padding: 0,
      fontFamily: SANS,
      ...style,
    }}
  >
    <span style={{ ...LABEL, color: tone }}>{label}</span>
    <span style={{ fontSize: 12, color: tone, fontWeight: 800 }} aria-hidden="true">
      {'\u203A'}
    </span>
  </button>
);
