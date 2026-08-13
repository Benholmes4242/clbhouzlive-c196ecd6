import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';

/**
 * COMMUNITY RAIL — a horizontal run of TRUE-ASPECT tiles.
 *
 * TRUE ASPECT is the whole point of this page: a 9:16 clip and a 16:9 drone
 * shot are different photographs, and cropping both to the same box is what
 * made the old sheet read as a wall. Tiles here share a fixed HEIGHT and let
 * WIDTH follow the media, so a row of mixed shapes stays on one baseline.
 *
 * The aspect is CLAMPED to [9:16, 16:9]: unclamped, one panorama would be
 * 1200px wide and one accidental 1:4 crop would be a sliver.
 */

/** Tile height. One baseline for every shape in the rail. */
const RAIL_H = 200;

const MIN_ASPECT = 9 / 16;
const MAX_ASPECT = 16 / 9;
/** Unmeasured media reads as portrait — the platform's dominant shape. */
const FALLBACK_ASPECT = 0.75;

export function clampAspect(aspect: number | null | undefined): number {
  if (!aspect || !Number.isFinite(aspect) || aspect <= 0) return FALLBACK_ASPECT;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
}

interface Props {
  moments: Moment[];
  title: string;
  onTilePress: (m: Moment) => void;
  autoplayGroup: string;
}

export function CommunityRail({ moments, title, onTilePress, autoplayGroup }: Props) {
  if (moments.length === 0) return null;

  return (
    <section style={{ marginBottom: 26 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#0E1216',
          margin: '0 0 8px',
          padding: '0 16px',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '0 16px 2px',
          scrollSnapType: 'x proximity',
          // Mobile scroll surface — canon requires the transform hint.
          willChange: 'transform',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {moments.map((m) => (
          <MomentTile
            key={m.key}
            moment={m}
            onPress={onTilePress}
            radius={8}
            initialsSize={26}
            labelSize={10}
            labelInset={8}
            scrimStop="45%"
            autoplayGroup={autoplayGroup}
            style={{
              height: RAIL_H,
              width: Math.round(RAIL_H * clampAspect(m.aspect)),
              flex: 'none',
              scrollSnapAlign: 'start',
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default CommunityRail;
