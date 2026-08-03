import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  /** Rendered as a KICKER - uppercase, tracked, muted. */
  title: string;
  /** The count, rendered as a right-aligned LABEL aside. */
  subtitle?: string;
  /** Start expanded? Default false (collapsed). */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSubsection: React.FC<Props> = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ margin: '24px 16px 0', fontFamily: FONT }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '12px 14px',
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line-2)',
          borderRadius: open ? '14px 14px 0 0' : 14,
          borderBottom: open ? 'none' : '1px solid var(--hcp-line-2)',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--hcp-t-100)',
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-60)',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-40)',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </span>
        )}
        <ChevronDown
          size={18}
          strokeWidth={2.2}
          style={{
            color: 'var(--hcp-t-40)',
            flexShrink: 0,
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            border: '1px solid var(--hcp-line-2)',
            borderTop: 'none',
            borderRadius: '0 0 14px 14px',
            background: 'var(--hcp-bg-2)',
            padding: '12px 0 4px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSubsection;
