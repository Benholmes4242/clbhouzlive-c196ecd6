import { memo } from 'react';

interface KickerProps {
  children: React.ReactNode;
  color?: 'amber' | 'emerald' | 'slate';
}

// Canonical kickers default to slate-500. amber + emerald variants kept for
// intentional tone shifts (e.g. ClipOfTheWeekHero uses emerald to signal
// curated content). amber kept available for explicit one-off editorial
// moments — should be rare.
const COLOR_MAP: Record<NonNullable<KickerProps['color']>, string> = {
  amber: 'hsl(var(--primary))',  // available but no longer default
  emerald: '#006747',
  slate: '#64748B',              // canonical neutral kicker
};

/**
 * Pro Shop primitive — small uppercase editorial label.
 * Sits above section titles to set tone.
 */
function KickerInner({ children, color = 'slate' }: KickerProps) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
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
