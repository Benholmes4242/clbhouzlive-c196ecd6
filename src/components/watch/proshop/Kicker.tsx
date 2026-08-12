import { memo } from 'react';

interface KickerProps {
  children: React.ReactNode;
  color?: 'amber' | 'emerald' | 'slate' | 'light';
}

// Canonical kickers default to slate-500. amber + emerald variants kept for
// intentional tone shifts (e.g. curated hero cards use emerald to signal
// curated content). amber kept available for explicit one-off editorial
// moments — should be rare. light is for dark mastheads.
const COLOR_MAP: Record<NonNullable<KickerProps['color']>, string> = {
  amber: '#0E1216',              // ink flip (Aug 2026) — was amber on white
  emerald: '#006747',
  slate: '#64748B',              // canonical neutral kicker
  light: 'rgba(255,255,255,0.55)', // light-on-dark eyebrow for dark mastheads
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
        fontWeight: 700,
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
