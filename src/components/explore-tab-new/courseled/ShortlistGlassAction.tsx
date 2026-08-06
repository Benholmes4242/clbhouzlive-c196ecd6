import React from 'react';
import { Bookmark, BookmarkPlus } from 'lucide-react';

/**
 * ShortlistGlassAction — the add-to-list control on Discover course imagery
 * (BRIEF_DISCOVER_RELEVANCE B1).
 *
 * Bottom-right of the image, in the same glass grammar as the when-chip
 * (rgba(10,14,10,0.55), blur, radius 999, 28px circle). Outline glyph when the
 * course is not shortlisted, FILLED white when it is. Never rendered when the
 * member is signed out or has already played/rated the course.
 */
interface Props {
  shortlisted: boolean;
  onToggle: () => void;
  label: string;
  size?: number;
}

export function ShortlistGlassAction({ shortlisted, onToggle, label, size = 28 }: Props) {
  const Glyph = shortlisted ? Bookmark : BookmarkPlus;
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={shortlisted}
      onClick={(ev: React.MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        onToggle();
      }}
      onKeyDown={(ev: React.KeyboardEvent) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.stopPropagation();
        ev.preventDefault();
        onToggle();
      }}
      style={{
        position: 'absolute',
        right: 6,
        bottom: 6,
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,14,10,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: 999,
        cursor: 'pointer',
      }}
    >
      <Glyph
        size={size >= 28 ? 15 : 13}
        color="#FFFFFF"
        strokeWidth={2}
        fill={shortlisted ? '#FFFFFF' : 'none'}
      />
    </span>
  );
}

export default ShortlistGlassAction;
