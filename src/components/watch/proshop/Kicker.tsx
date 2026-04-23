import { memo } from 'react';

interface KickerProps {
  children: React.ReactNode;
  color?: 'amber' | 'emerald' | 'slate';
}

// Phase 5f: amber → primary token (exact match: --primary 31 93% 54% = #F7931E).
// Emerald + slate kept as hex — no matching design token exists.
const COLOR_MAP: Record<NonNullable<KickerProps['color']>, string> = {
  amber: 'hsl(var(--primary))',
  emerald: '#006747',
  slate: '#0F172A',
};

/**
 * Pro Shop primitive — small uppercase editorial label.
 * Sits above section titles to set tone.
 */
function KickerInner({ children, color = 'amber' }: KickerProps) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLOR_MAP[color],
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

export const Kicker = memo(KickerInner);
