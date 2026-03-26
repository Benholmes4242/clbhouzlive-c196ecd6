/**
 * PlayerSilhouette — Frosted-glass inline SVG golfer silhouette.
 * Used as fallback when a player headshot is unavailable.
 */

interface PlayerSilhouetteProps {
  size?: number;
  className?: string;
}

export function PlayerSilhouette({ size = 44, className }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      style={{ display: 'block' }}
    >
      {/* Head */}
      <circle
        cx="50" cy="28" r="14"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth="2"
      />
      {/* Neck */}
      <line
        x1="50" y1="42" x2="50" y2="50"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Torso */}
      <path
        d="M 50 50 L 35 82 L 65 82 Z"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Left arm */}
      <path
        d="M 42 56 Q 26 64 22 78"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Right arm — extended holding club */}
      <path
        d="M 58 56 Q 72 62 76 72"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Golf club shaft */}
      <line
        x1="76" y1="72" x2="82" y2="32"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Club head */}
      <path
        d="M 82 32 L 88 28 L 86 34 Z"
        fill="rgba(255,255,255,0.25)"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth="1"
      />
      {/* Left leg */}
      <line
        x1="42" y1="82" x2="36" y2="108"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Right leg */}
      <line
        x1="58" y1="82" x2="64" y2="108"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
