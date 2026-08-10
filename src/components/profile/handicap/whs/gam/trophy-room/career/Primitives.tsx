/**
 * Career record primitives. Flat panels, hairline borders, one scroller.
 * No glows, no watermarks, no full-bleed glyphs, no "tap anywhere to close".
 */
import React, { useState } from 'react';
import { REC, KICKER, LABEL, CAPTION, FIGURE } from './tokens';

export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...KICKER, fontFamily: REC.FONT }}>{children}</div>
);

export const MetaLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color,
}) => <span style={{ ...LABEL, fontFamily: REC.FONT, color: color ?? LABEL.color }}>{children}</span>;

export const Caption: React.FC<{ children: React.ReactNode; center?: boolean }> = ({
  children,
  center,
}) => (
  <div
    style={{
      ...CAPTION,
      fontFamily: REC.FONT,
      textAlign: center ? 'center' : 'left',
    }}
  >
    {children}
  </div>
);

export const Figure: React.FC<{
  value: React.ReactNode;
  size?: number;
  color?: string;
  width?: number;
}> = ({ value, size = 22, color, width }) => (
  <span
    style={{
      ...FIGURE,
      fontFamily: REC.FONT,
      fontSize: size,
      color: color ?? FIGURE.color,
      display: 'inline-block',
      width,
      flexShrink: 0,
    }}
  >
    {value}
  </span>
);

export const Panel: React.FC<{
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <section style={{ marginBottom: 12 }}>
    {(title || action) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 2px 8px',
        }}
      >
        {title ? <MetaLabel>{title}</MetaLabel> : <span />}
        {action}
      </div>
    )}
    <div
      style={{
        background: REC.PANEL,
        border: `1px solid ${REC.BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  </section>
);

/**
 * ONE height everywhere. The height prop is gone on purpose: a call site that
 * wants a different one is a signal the treatment is wrong, not that the prop
 * is useful.
 */
const BAR_HEIGHT = 4;

export const Bar: React.FC<{ pct: number; color?: string }> = ({ pct, color }) => (
  <div
    style={{
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      background: REC.BAR_TRACK,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(100, pct))}%`,
        height: '100%',
        background: color ?? REC.AMBER,
      }}
    />
  </div>
);

export const RowButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  last?: boolean;
  ariaLabel?: string;
}> = ({ onClick, children, last, ariaLabel }) => {
  const style: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    borderBottom: last ? 'none' : `1px solid ${REC.BORDER}`,
    padding: '12px 14px',
    fontFamily: REC.FONT,
    color: REC.INK,
    cursor: onClick ? 'pointer' : 'default',
  };
  if (!onClick) return <div style={style}>{children}</div>;
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} style={style}>
      {children}
    </button>
  );
};

export const Action: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'transparent',
      border: 'none',
      padding: 0,
      fontFamily: REC.FONT,
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '0.02em',
      // A quiet CTA is not a threshold passed: amber on this surface means a
      // tier reached, a record held, or the viewing member. Every "Show all"
      // on the sheet reads ink because of this one line.
      color: REC.INK,
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

export const BackLink: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'transparent',
      border: 'none',
      padding: '0 0 12px',
      fontFamily: REC.FONT,
      fontSize: 12,
      fontWeight: 600,
      color: REC.MUTE,
      cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: '16px 2px 8px' }}>
    <MetaLabel>{children}</MetaLabel>
  </div>
);

export const Dot: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden
    style={{
      width: 7,
      height: 7,
      borderRadius: 4,
      background: on ? REC.AMBER : REC.TRACK,
      display: 'inline-block',
      flexShrink: 0,
    }}
  />
);

/**
 * Collapsible list. Built once and used by every panel whose list can grow,
 * so no panel hand-rolls its own "show more". Over `threshold` rows it shows
 * `collapsedCount` and a quiet action; the panel aside keeps stating the full
 * total so collapsing never hides the headline figure.
 */
export const Collapsible: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  collapsedCount?: number;
  showAllLabel: string;
  showFewerLabel: string;
}> = ({ children, threshold = 5, collapsedCount = 3, showAllLabel, showFewerLabel }) => {
  const [open, setOpen] = useState(false);
  const rows = React.Children.toArray(children);
  if (rows.length <= threshold) return <>{rows}</>;
  return (
    <>
      {open ? rows : rows.slice(0, collapsedCount)}
      <div style={{ padding: '11px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
        <Action onClick={() => setOpen((prev) => !prev)}>
          {open ? showFewerLabel : showAllLabel}
        </Action>
      </div>
    </>
  );
};
