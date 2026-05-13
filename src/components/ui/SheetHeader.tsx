import React from 'react';
import { X } from 'lucide-react';

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
}

/**
 * Canonical sheet header for bottom sheets across the app.
 *
 * Pattern: optional eyebrow caps + 24/800 ink h1 + optional subhead + X close button.
 * Used in filter-selection sheets, info-explainer sheets, and nav overlays.
 *
 * NOT used for photo-led sheets (FriendRoundSheet, RoundDetailSheet) which have
 * their own dark-photo chrome, or icon-tile card-detail sheets (StablefordDetailSheet,
 * IntelligenceSheet) which use a card-detail-continuation pattern with smaller
 * 17/800 titles. Those are documented exceptions, not anti-patterns.
 */
export const SheetHeader: React.FC<SheetHeaderProps> = ({
  eyebrow,
  title,
  sub,
  onClose,
  closeAriaLabel = 'Close',
  borderBottom = true,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '8px 16px 14px',
      borderBottom: borderBottom ? '0.5px solid rgba(15,23,42,0.08)' : 'none',
      flexShrink: 0,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      {eyebrow && (
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#64748B',
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
          fontSize: 24,
          fontWeight: 800,
          color: '#0F172A',
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
            fontSize: 13,
            fontWeight: 500,
            color: '#64748B',
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
        background: 'rgba(15,23,42,0.06)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        color: '#0F172A',
      }}
    >
      <X size={15} strokeWidth={2.4} />
    </button>
  </div>
);

export default SheetHeader;
