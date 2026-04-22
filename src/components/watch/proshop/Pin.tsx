import { memo } from 'react';

interface PinProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light';
  icon?: React.ReactNode;
}

/**
 * Pro Shop primitive — dark glass badge for course names, durations, formats.
 * Used as overlay on media tiles and hero cards.
 */
function PinInner({ children, variant = 'dark', icon }: PinProps) {
  const isDark = variant === 'dark';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.95)',
        color: isDark ? 'rgba(255,255,255,0.95)' : '#0F172A',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.2,
        backdropFilter: isDark ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: isDark ? 'blur(8px)' : undefined,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {icon ? <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span> : null}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </div>
  );
}

export const Pin = memo(PinInner);
