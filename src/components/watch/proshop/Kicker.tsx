import { memo } from 'react';

interface KickerProps {
  children: React.ReactNode;
  color?: 'amber' | 'emerald' | 'slate';
}

const COLOR_MAP: Record<NonNullable<KickerProps['color']>, string> = {
  amber: '#F7931E',
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
