/**
 * HandicapAvatarFallback — Canonical fallback avatar used across the platform
 * when a player photo is unavailable. Matches the handicap page exactly:
 * initials text on the dark slate squircle surface (`--hcp-bg-3` /
 * `--hcp-t-soft`), 34% border-radius squircle.
 */
import { initials as toInitials } from '@/lib/whs/utils/initials';

interface HandicapAvatarFallbackProps {
  name?: string | null;
  /** Outer box size in px (square). The component fills its parent if not set. */
  size?: number;
  /** When true, render only the inner contents — caller controls the box. */
  contentsOnly?: boolean;
  className?: string;
}

export function HandicapAvatarFallback({
  name,
  size,
  contentsOnly = false,
  className,
}: HandicapAvatarFallbackProps) {
  const text = toInitials(name);
  // Scale font to ~36% of the box so 2 letters fit comfortably
  const fontSize = size ? Math.max(10, Math.round(size * 0.36)) : undefined;

  if (contentsOnly) {
    return (
      <span
        className={className}
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--hcp-bg-3)',
          color: 'var(--hcp-t-soft)',
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.01em',
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: 'var(--hcp-bg-3)',
        color: 'var(--hcp-t-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.01em',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {text}
    </div>
  );
}
