/**
 * PlayerSilhouette — Glass-style neutral avatar placeholder.
 * Used as fallback when a player headshot is unavailable.
 */

interface PlayerSilhouetteProps {
  size?: number;
  className?: string;
}

export function PlayerSilhouette({ size = 44, className }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        {/* Glass background gradient — light at top, darker at bottom */}
        <linearGradient id="ps-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
        {/* Figure fill — slightly brighter than bg */}
        <linearGradient id="ps-figure" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.40)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.22)" />
        </linearGradient>
      </defs>

      {/* Glass background */}
      <rect width="100" height="100" fill="url(#ps-bg)" />

      {/* Subtle top highlight — glass sheen */}
      <rect width="100" height="40" fill="rgba(255,255,255,0.05)" />

      {/* Head */}
      <circle cx="50" cy="36" r="17" fill="url(#ps-figure)" />

      {/* Shoulders */}
      <path
        d="M 2 102 Q 2 66 50 66 Q 98 66 98 102"
        fill="url(#ps-figure)"
      />

      {/* Glass border — 1px inner rim */}
      <rect
        width="98" height="98" x="1" y="1"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
