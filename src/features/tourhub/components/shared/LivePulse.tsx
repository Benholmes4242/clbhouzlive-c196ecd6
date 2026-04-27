/**
 * LivePulse — shared 7px amber pulsing dot for live-state indicators.
 *
 * Used inside hero narrative pills (TournamentHero), and elsewhere wherever a
 * live-state visual cue is needed. Keep token-free hex matching the editorial
 * amber palette already established in MastheadPill.
 */

interface LivePulseProps {
  size?: number;
}

export function LivePulse({ size = 7 }: LivePulseProps) {
  return (
    <span
      aria-hidden="true"
      className="animate-live-pulse"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#FFB95C',
        boxShadow: '0 0 0 2px rgba(255,185,92,0.25)',
        flexShrink: 0,
      }}
    />
  );
}
