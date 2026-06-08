import { memo } from 'react';

/**
 * RailSkeleton — placeholder reserving vertical space for rails on the Clips
 * and Videos subpages while data is still loading. Prevents the cascade of
 * layout shifts that previously thrashed the page (and the fixed CompactHeader
 * backdrop blur) as each rail's `if (isLoading) return null` returned null
 * then suddenly inserted hundreds of pixels of content.
 *
 * Variants mirror the actual rails' dimensions so the swap from skeleton
 * to real content is in-place (no jump).
 */

type Variant =
  | 'hero-portrait'   // ClipOfTheWeekHero (9/16, maxHeight 460)
  | 'hero-landscape'  // VideoOfTheWeekHero (16/9)
  | 'rail-portrait'   // WatchRailTile (w200, 3/4)
  | 'rail-landscape'  // VideoRailTile (w280, 16/9)
  | 'rail-square';    // MostLoved (w200, 4/5)

interface RailSkeletonProps {
  variant: Variant;
  /** Number of tiles to render for rail variants. Default 4. */
  count?: number;
  /** Show a section header placeholder above. Default true for rails. */
  showHeader?: boolean;
}

const PLACEHOLDER_BG = 'rgba(15,23,42,0.06)';
const PLACEHOLDER_BG_STRONG = 'rgba(15,23,42,0.08)';

function SectionHeaderSkeleton() {
  return (
    <div style={{ padding: '24px 16px 12px' }}>
      <div
        style={{
          width: 160,
          height: 18,
          borderRadius: 4,
          background: PLACEHOLDER_BG_STRONG,
        }}
      />
      <div
        style={{
          width: 220,
          height: 12,
          borderRadius: 4,
          background: PLACEHOLDER_BG,
          marginTop: 8,
        }}
      />
    </div>
  );
}

function Tile({ width, aspect }: { width: number; aspect: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width,
        aspectRatio: aspect,
        borderRadius: 12,
        background: PLACEHOLDER_BG_STRONG,
      }}
    />
  );
}

function HRailSkeleton({ width, aspect, count }: { width: number; aspect: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflow: 'hidden',
        padding: '0 0 16px 16px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Tile key={i} width={width} aspect={aspect} />
      ))}
    </div>
  );
}

function RailSkeletonInner({ variant, count = 4, showHeader = true }: RailSkeletonProps) {
  if (variant === 'hero-portrait') {
    return (
      <section style={{ padding: '24px 16px 12px' }}>
        <div
          style={{
            width: 140,
            height: 12,
            borderRadius: 4,
            background: PLACEHOLDER_BG_STRONG,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: '100%',
            aspectRatio: '9/16',
            maxHeight: 460,
            borderRadius: 12,
            background: PLACEHOLDER_BG_STRONG,
          }}
        />
      </section>
    );
  }

  if (variant === 'hero-landscape') {
    return (
      <section style={{ padding: '24px 16px 12px' }}>
        <div
          style={{
            width: 140,
            height: 12,
            borderRadius: 4,
            background: PLACEHOLDER_BG_STRONG,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 12,
            background: PLACEHOLDER_BG_STRONG,
          }}
        />
      </section>
    );
  }

  const tile =
    variant === 'rail-landscape' ? { width: 280, aspect: '16/9' }
    : variant === 'rail-square'  ? { width: 200, aspect: '4/5' }
    : /* rail-portrait */         { width: 200, aspect: '3/4' };

  return (
    <section>
      {showHeader ? <SectionHeaderSkeleton /> : null}
      <HRailSkeleton width={tile.width} aspect={tile.aspect} count={count} />
    </section>
  );
}

export const RailSkeleton = memo(RailSkeletonInner);
export default RailSkeleton;
