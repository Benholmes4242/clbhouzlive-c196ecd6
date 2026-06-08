import React from 'react';
import { X } from 'lucide-react';

const FONT_SERIF = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface SheetHeaderProps {
  /** Caps eyebrow above the title. Optional — omit for sheets with no eyebrow context. */
  eyebrow?: string;
  /** Sheet title — the main identity moment. */
  title: React.ReactNode;
  /** Optional subhead below the title. */
  sub?: React.ReactNode;
  /** Click handler for the X close button. */
  onClose: () => void;
  /** Optional accessible label for the close button. Defaults to "Close". */
  closeAriaLabel?: string;
  /** Whether to render a bottom border separating the header from body content. Defaults to true. */
  borderBottom?: boolean;
  /** When true, flips colours for dark-scope contexts (handicap dashboard). */
  dark?: boolean;
}

/**
 * Canonical sheet header for bottom sheets across the app.
 */
export const SheetHeader: React.FC<SheetHeaderProps> = ({
  eyebrow,
  title,
  sub,
  onClose,
  closeAriaLabel = 'Close',
  borderBottom = true,
  dark = false,
}) => {
  const titleColor = dark ? 'var(--hcp-t-100)' : '#0F172A';
  const eyebrowColor = dark ? 'var(--hcp-t-60)' : '#64748B';
  const subColor = dark ? 'var(--hcp-t-60)' : '#64748B';
  const borderColor = dark ? 'var(--hcp-line-2)' : 'rgba(15,23,42,0.08)';
  const closeBg = dark ? 'var(--hcp-bg-3)' : 'rgba(15,23,42,0.06)';
  const closeColor = dark ? 'var(--hcp-t-100)' : '#0F172A';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 16px 14px',
        borderBottom: borderBottom ? `0.5px solid ${borderColor}` : 'none',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 9,
                fontWeight: 800,
                color: eyebrowColor,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}
        <h2
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 24,
            fontWeight: 800,
            color: titleColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 13,
              fontWeight: 500,
              color: subColor,
              lineHeight: 1.4,
              margin: '6px 0 0',
            }}
          >
            {sub}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label={closeAriaLabel}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: closeBg,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          color: closeColor,
        }}
      >
        <X size={15} strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default SheetHeader;
