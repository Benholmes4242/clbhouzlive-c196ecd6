import type React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * The ONE tile treatment for search result rows (BRIEF_SEARCH_OVERLAY_ALIGNMENT §3).
 * 44px, radius 13, TRACK fill, 1px BORDER, contents in MUTE.
 * `white` is the single legitimate exception: a club logo needs a white plate.
 */
export function ResultTile({
  children,
  white = false,
}: {
  children: React.ReactNode;
  white?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden shrink-0 flex items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 13,
        background: white ? '#FFFFFF' : A.TRACK,
        border: `1px solid ${A.BORDER}`,
        color: A.MUTE,
      }}
    >
      {children}
    </div>
  );
}

export const TILE_INITIALS: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: A.MUTE,
};
