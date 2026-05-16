import React from 'react';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

/**
 * Shared 124px-tall card chrome for the small Cinema-family friend cards.
 * White surface, 0.5px hairline, 16px radius, soft shadow.
 */
export const SmallCardShell: React.FC<Props> = ({ onClick, ariaLabel, children }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: 124,
        margin: '0 20px 12px',
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid rgba(15,23,42,0.07)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        fontFamily: FONT_GEIST,
      }}
    >
      {children}
    </div>
  );
};

export default SmallCardShell;
