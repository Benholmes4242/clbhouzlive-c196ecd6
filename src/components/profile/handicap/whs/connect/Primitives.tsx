import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import {
  PANEL, BORDER, INK, MUTE, DIM, AMBER, TRACK, FONT,
  KICKER, LABEL, NUM,
} from './designTokens';

/** Panel: white surface, 1px border, radius 16, padding 16. */
export const Panel: React.FC<{
  kicker?: string;
  kickerColor?: string;
  aside?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ kicker, kickerColor, aside, style, children }) => (
  <div
    style={{
      background: PANEL,
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: 16,
      ...style,
    }}
  >
    {(kicker || aside) && (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {kicker ? (
          <div style={{ ...KICKER, ...(kickerColor ? { color: kickerColor } : null) }}>{kicker}</div>
        ) : (
          <span />
        )}
        {aside ? <div style={{ ...LABEL, textAlign: 'right' }}>{aside}</div> : null}
      </div>
    )}
    {children}
  </div>
);

/** The only vertical spacer between stacked panels. */
export const PanelGap: React.FC = () => <div style={{ height: 14 }} />;

export const Rule: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ height: 1, background: BORDER, ...style }} />
);

/** Figure: label, value, optional sub. Sits in a flex row of equals. */
export const Figure: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  size?: number;
}> = ({ label, value, sub, size = 20 }) => (
  <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
    <div style={{ ...LABEL, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: INK,
        ...NUM,
      }}
    >
      {value}
    </div>
    {sub ? <div style={{ ...LABEL, marginTop: 5 }}>{sub}</div> : null}
  </div>
);

/** Right-aligned reference row - identifiers, not figures. */
export const RefRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12,
      padding: '4px 0',
    }}
  >
    <div style={LABEL}>{label}</div>
    <div style={{ fontSize: 13, color: MUTE, ...NUM }}>{value}</div>
  </div>
);

/** Row separation inside a panel. Never a divider on the first row. */
export const rowStyle = (first: boolean, n = 12): React.CSSProperties => ({
  padding: first ? `0 0 ${n}px` : `${n}px 0`,
  borderTop: first ? undefined : `1px solid ${BORDER}`,
});

/** Primary button. ONE per screen, in a footer bar. */
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ children, onClick, disabled, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '15px 18px',
      borderRadius: 12,
      border: 'none',
      background: disabled ? TRACK : INK,
      color: disabled ? DIM : '#FFF',
      fontFamily: FONT,
      fontSize: 14.5,
      fontWeight: 700,
      cursor: disabled ? 'default' : 'pointer',
    }}
  >
    {children}
  </button>
);

/** Quiet Action: LABEL type, no chrome, followed by a rendered chevron. */
export const Action: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  chevron?: boolean;
}> = ({ children, onClick, color = INK, chevron = true }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      cursor: 'pointer',
      fontFamily: FONT,
      ...LABEL,
      color,
    }}
  >
    {children}
    {chevron ? <ChevronRight size={12} strokeWidth={2.6} /> : null}
  </button>
);

/**
 * BackRow: the ONLY top chrome on this surface. Transparent and borderless, so
 * the wash runs straight through it - no screen paints a top bar.
 *
 * The chevron and the label are ONE 44px-tall button, never a chevron with a
 * dead label beside it. Where a stage has no back the button renders at 0.3
 * opacity and is disabled, so the header never changes height between stages.
 */
export const BackRow: React.FC<{
  title: string;
  onBack?: () => void;
  /** Immersive host: content must clear the notch while the wash runs behind it. */
  immersive?: boolean;
}> = ({ title, onBack, immersive }) => {
  const [pressed, setPressed] = useState(false);
  const disabled = !onBack;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 4,
        paddingTop: immersive
          ? 'calc(max(env(safe-area-inset-top, 0px), 12px) + 6px)'
          : 6,
        background: 'transparent',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        aria-label={disabled ? undefined : `Back to ${title}`}
        aria-disabled={disabled}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          minHeight: 44,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 10px 0 6px',
          border: 'none',
          borderRadius: 12,
          background: pressed && !disabled ? 'rgba(14,18,22,0.06)' : 'transparent',
          transition: 'background 120ms ease',
          opacity: disabled ? 0.3 : 1,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: FONT,
        }}
      >
        <ChevronLeft size={17} strokeWidth={2.4} color={INK} />
        <span style={{ ...KICKER, fontSize: 9, color: INK }}>{title}</span>
      </button>
    </div>
  );
};

/**
 * Bottom action area. Transparent: the wash and canvas continue behind it.
 * 16/22/8 padding PLUS max(env(safe-area-inset-bottom), 20px), so text clears
 * the home indicator on a notched device and still gets 20px on a notchless one.
 */
export const FooterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      padding: '16px 22px 8px',
      paddingBottom: 'calc(8px + max(env(safe-area-inset-bottom, 0px), 20px))',
      background: 'transparent',
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);



/** Column shell: fixed header, scrolling body, fixed footer. */
export const ScreenShell: React.FC<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ header, footer, children }) => (
  <div className="flex flex-col flex-1 min-h-0" style={{ fontFamily: FONT }}>
    {header}
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>{children}</div>
    {footer}
  </div>
);

/** The h1 copy block. Padding keeps it optically aligned with panel content. */
export const CopyBlock: React.FC<{
  kicker?: string;
  kickerColor?: string;
  children: React.ReactNode;
}> = ({ kicker, kickerColor, children }) => (
  <div style={{ padding: '0 4px 20px' }}>
    {kicker ? (
      <div style={{ ...KICKER, ...(kickerColor ? { color: kickerColor } : null), marginBottom: 10 }}>
        {kicker}
      </div>
    ) : null}
    {children}
  </div>
);

/** ONE indeterminate indicator. No percentage, no fake progress. */
export const Indeterminate: React.FC = () => (
  <div
    style={{
      height: 3,
      borderRadius: 2,
      background: TRACK,
      overflow: 'hidden',
      marginBottom: 18,
    }}
  >
    <div
      style={{
        height: '100%',
        width: '38%',
        borderRadius: 2,
        background: AMBER,
        animation: 'whsIndet 1400ms ease-in-out infinite',
      }}
    />
    <style>{`
      @keyframes whsIndet {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(263%); }
      }
    `}</style>
  </div>
);

/** Shared collapsible list - light surface variant. */
export const Collapsible: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  collapsedCount?: number;
  showAllLabel: string;
  showFewerLabel: string;
}> = ({ children, threshold = 4, collapsedCount = 4, showAllLabel, showFewerLabel }) => {
  const [open, setOpen] = useState(false);
  const rows = React.Children.toArray(children);
  if (rows.length <= threshold) return <>{rows}</>;
  return (
    <>
      {open ? rows : rows.slice(0, collapsedCount)}
      <div style={{ padding: '12px 0 0', borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
        <Action onClick={() => setOpen((p) => !p)}>{open ? showFewerLabel : showAllLabel}</Action>
      </div>
    </>
  );
};

/**
 * ONE vertical structure for every stage: content flows from the top with
 * identical padding, so the headline lands in the same place on every screen.
 */
export const FlowBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 22px 0' }}>
    {children}
  </div>
);

/** The flow headline block: optional kicker, headline, optional sub. */
export const FlowHead: React.FC<{
  kicker?: string;
  kickerColor?: string;
  headline: React.ReactNode;
  sub?: React.ReactNode;
  /** 29 by default; 26-27 where the headline is shorter. */
  size?: number;
}> = ({ kicker, kickerColor, headline, sub, size = 29 }) => (
  <div>
    {kicker ? (
      <div style={{ ...KICKER, fontSize: 9, color: kickerColor ?? MUTE, marginBottom: 10 }}>
        {kicker}
      </div>
    ) : null}
    <h1
      style={{
        margin: 0,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.035em',
        lineHeight: 1.08,
        color: INK,
      }}
    >
      {headline}
    </h1>
    {sub ? (
      <p
        style={{
          margin: '11px 0 0',
          fontSize: 14.5,
          fontWeight: 500,
          lineHeight: 1.5,
          color: MUTE,
        }}
      >
        {sub}
      </p>
    ) : null}
  </div>
);
