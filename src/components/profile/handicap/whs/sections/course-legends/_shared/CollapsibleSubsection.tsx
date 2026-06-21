import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  title: string;
  /** Small grey line under the title, e.g. "5 played · 7 titles held". */
  subtitle?: string;
  /** Optional leading glyph/emoji. */
  icon?: React.ReactNode;
  /** Start expanded? Default false (collapsed). */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSubsection: React.FC<Props> = ({
  title,
  subtitle,
  icon,
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
          gap: 11,
          width: '100%',
          padding: '13px 14px',
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
        {icon != null && (
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--hcp-bg-2)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 16,
            }}
          >
            {icon}
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--hcp-t-100)', letterSpacing: '0.01em' }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ display: 'block', fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 1 }}>
              {subtitle}
            </span>
          )}
        </span>
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
