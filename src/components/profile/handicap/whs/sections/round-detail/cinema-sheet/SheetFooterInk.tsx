import React from 'react';
import { ExternalLink } from 'lucide-react';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
const INK = '#0F172A';
const INK_MUTE = '#64748B';
const SURFACE = '#F8FAFC';
interface Props {
  label: string;
  currentIndex: number | null;
  /** Previous index (renders strikethrough). Pass null to hide. */
  previousIndex?: number | null;
  /** Negative = improvement (green), positive = regress (red). null hides. */
  delta?: number | null;
  action: React.ReactNode | null;
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: INK_MUTE,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  marginBottom: 3,
  fontFamily: FONT_GEIST,
};

export const SheetFooterInk: React.FC<Props> = ({
  label,
  currentIndex,
  previousIndex,
  delta,
  action,
}) => {
  const showDelta = delta != null && Math.abs(delta) >= 0.05;
  const showPrev = showDelta && previousIndex != null;
  const hasLeft = currentIndex != null;

  if (!hasLeft && !action) return null;

  return (
    <div
      style={{
        background: SURFACE,
        color: INK,
        padding: '14px 18px 18px',
        paddingBottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: hasLeft ? 'space-between' : 'flex-end',
        gap: 12,
        marginTop: 'auto',
        flexShrink: 0,
        fontFamily: FONT_GEIST,
        borderTop: '0.5px solid rgba(15,23,42,0.08)',
      }}
    >
      {hasLeft && (
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>{label}</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 400,
                color: INK,
                fontFamily: FONT_MONO,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {currentIndex!.toFixed(1)}
            </span>
            {showPrev && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(15,23,42,0.45)',
                  fontFamily: FONT_MONO,
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(15,23,42,0.30)',
                }}
              >
                {previousIndex!.toFixed(1)}
              </span>
            )}
            {showDelta && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: delta! < 0 ? '#16A34A' : '#DC2626',
                }}
              >
                {delta! < 0 ? '\u2193' : '\u2191'} {Math.abs(delta!).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}
      {action}
    </div>
  );
};

export const FooterPill: React.FC<{
  href?: string;
  onClick?: () => void;
  label: string;
  external?: boolean;
  trailing?: React.ReactNode;
}> = ({ href, onClick, label, external, trailing }) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'var(--hcp-bg-0)',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.10em',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: FONT_GEIST,
  };
  const inner = (
    <>
      {label}
      {external && <ExternalLink size={11} strokeWidth={1.8} />}
      {trailing}
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={style}>
      {inner}
    </button>
  );
};

export default SheetFooterInk;
