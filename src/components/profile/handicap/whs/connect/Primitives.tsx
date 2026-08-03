import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import {
  PANEL, BORDER, INK, MUTE, DIM, AMBER, AMBER_DEEP, TRACK, FONT,
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
        fontWeight: 800,
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
}> = ({ children, onClick, color = AMBER_DEEP, chevron = true }) => (
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

export const HeaderBar: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 20px',
      background: PANEL,
      borderBottom: `1px solid ${BORDER}`,
      flexShrink: 0,
    }}
  >
    {onBack ? (
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer', color: MUTE }}
      >
        <ChevronLeft size={17} strokeWidth={2.2} />
      </button>
    ) : null}
    <div style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>{title}</div>
  </div>
);

export const FooterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, background: PANEL, flexShrink: 0 }}>
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
