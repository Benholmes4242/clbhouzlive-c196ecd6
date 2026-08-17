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
 *
 * THE SCROLLER IS ASYMMETRIC ON PURPOSE (BRIEF_COMMUNITY_PAGE_REFINE §1):
 * 16px on the left so the first tile shares a left edge with the heading, and
 * ZERO on the right so the last tile bleeds off the viewport. A rail padded on
 * both sides reads as a finished row that happens to be clipped; a rail that
 * runs off the edge announces that it scrolls. Do not "fix" this.
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

/** The page's ONE heading treatment (§5.2). Every section uses this. */
export const HEADING_STYLE = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: '#0E1216',
  margin: '0 0 9px',
  padding: '0 16px',
} as const;

/** Gutters shared by EVERY horizontal scroller on the page (§1). */
export const SCROLLER_GUTTER = {
  overflowX: 'auto',
  paddingLeft: 16,
  paddingRight: 0,
  scrollPaddingLeft: 16,
  // Mobile scroll surface — canon requires the transform hint.
  willChange: 'transform',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
} as const;

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
      <h2 style={HEADING_STYLE}>{title}</h2>

      <div
        style={{
          display: 'flex',
          gap: 6,
          paddingBottom: 2,
          scrollSnapType: 'x proximity',
          ...SCROLLER_GUTTER,
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
