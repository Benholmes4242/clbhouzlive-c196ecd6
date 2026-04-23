import { memo } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface CreatorChipProps {
  name: string;
  avatarUrl?: string | null;
  /**
   * Constrains label width so long display names don't overflow tile.
   * Defaults to 110.
   */
  maxLabelWidth?: number;
  /** Optional click handler — when provided, chip becomes a real button. */
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Pro Shop primitive — canonical bottom-left creator chip used across Watch,
 * Clips and Videos tile/rail surfaces. Pairs a SquircleAvatar with a creator
 * label inside a solid-scrim glass pill.
 *
 * Visual rules (Phase 1c, mobile perf):
 *  - Solid `rgba(0,0,0,0.6)` scrim, NO backdrop-filter
 *  - Squircle avatar (18px, no ring)
 *  - 11px / 600 white label, ellipsis on overflow
 *
 * See `mem://constraints/mobile-performance-rendering`.
 */
function CreatorChipInner({ name, avatarUrl, maxLabelWidth = 110, onClick }: CreatorChipProps) {
  const Component: any = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 999,
        padding: '2px 8px 2px 2px',
        maxWidth: '100%',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>
        <SquircleAvatar src={avatarUrl ?? undefined} alt={name} size={18} hideRing />
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'white',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: maxLabelWidth,
        }}
      >
        {name}
      </span>
    </Component>
  );
}

export const CreatorChip = memo(CreatorChipInner);
