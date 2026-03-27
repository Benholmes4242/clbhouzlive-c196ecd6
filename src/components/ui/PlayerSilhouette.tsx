/**
 * PlayerSilhouette — Neutral avatar placeholder.
 * Used as fallback when a player headshot is unavailable.
 */

interface PlayerSilhouetteProps {
  size?: number;
  className?: string;
}

export function PlayerSilhouette({ size = 44, className }: PlayerSilhouetteProps) {
  const s = size;
  return (
    <svg
      viewBox="0 0 100 100"
      width={s}
      height={s}
      className={className}
      style={{ display: 'block' }}
    >
      {/* Background fill */}
      <rect width="100" height="100" fill="rgba(255,255,255,0.08)" />

      {/* Head */}
      <circle cx="50" cy="38" r="18" fill="rgba(255,255,255,0.22)" />

      {/* Shoulders / body arc */}
      <path
        d="M 6 100 Q 6 68 50 68 Q 94 68 94 100"
        fill="rgba(255,255,255,0.18)"
      />
    </svg>
  );
}
