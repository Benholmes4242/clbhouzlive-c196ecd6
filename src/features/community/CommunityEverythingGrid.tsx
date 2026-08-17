import { useEffect, useRef, useState } from 'react';

import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';

/**
 * EVERYTHING GRID — the complete index, three square tiles per row.
 *
 * SQUARE HERE, TRUE ASPECT ABOVE, deliberately. The rails present a handful of
 * photographs and their shape is information; this grid presents everything and
 * its job is scanning. A ragged masonry of 700 mixed-aspect tiles is not an
 * index, and a member looking for "the rest" wants an even field.
 *
 * INCREMENTAL, NOT PAGED. The pool is already in memory (one query), so this
 * only governs how many tiles are MOUNTED: 700 live tiles is a DOM footprint
 * problem, not a data problem. A sentinel at the foot reveals the next STEP as
 * it comes into view, so there is no button and no fetch.
 *
 * AUTOPLAY IS OFF for these tiles. Three-up squares are ~120px; the tile's own
 * finding is that video at that size reads as flicker, not motion.
 */

/** Tiles mounted initially, and added per reveal. Multiple of 3 = whole rows. */
const STEP = 30;

interface Props {
  moments: Moment[];
  onTilePress: (m: Moment) => void;
}

export function CommunityEverythingGrid({ moments, onTilePress }: Props) {
  const [shown, setShown] = useState(STEP);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // A NEW POOL RESETS THE REVEAL. Without this, switching filters would keep a
  // scrolled-deep count and mount 400 tiles of a freshly narrowed list.
  useEffect(() => setShown(STEP), [moments]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= moments.length) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown((n) => Math.min(n + STEP, moments.length));
      },
      // Reveal BEFORE the foot is reached so the grid never shows its end.
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, moments.length]);

  if (moments.length === 0) return null;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          padding: '0 16px',
        }}
      >
        {moments.slice(0, shown).map((m) => (
          <MomentTile
            key={m.key}
            moment={m}
            onPress={onTilePress}
            radius={4}
            initialsSize={18}
            labelSize={9}
            labelInset={6}
            // Too small for moving video to read — poster only.
            autoplay={false}
            // A square crop leaves no room for a course name to be legible;
            // the tap target carries the course, the label would be noise.
            labelled={false}
            style={{ aspectRatio: '1 / 1', width: '100%' }}
          />
        ))}
      </div>
      <div ref={sentinel} aria-hidden style={{ height: 1 }} />
    </>
  );
}

export default CommunityEverythingGrid;
