/**
 * ProfileSurfaceSkeleton — the ONE loading silhouette for both profile
 * surfaces, configured by props (BRIEF_LOADING_SKELETONS §1 and §2: one
 * skeleton component, not two that drift apart).
 *
 * Every dimension below is measured off the shipped components it stands in
 * for, so the loaded page lands on its own outline:
 *
 *   HeroShell            padding '0 16px 16px', paddingTop = content inset +18
 *                        avatar 56 r16, name 20/800, subline 11.5/600,
 *                        pill minHeight 34, headline label 8.5 caps + 40px
 *                        figure, sparkline 42 (marginTop 10), strip marginTop
 *                        14 over a 1px W_10 rule + 13 padding, cell figure 17
 *                        + 7.5 caps label (marginTop 4)
 *   canvas bio           12.5/1.55, READ MORE inside a 44px box, website chip
 *                        minHeight 44 r999
 *   ProfileTopTenRail    kicker 9.5 caps, subtitle 11.5 (marginTop 3), rail
 *                        marginTop 12 / gap 9 / paddingLeft 16, card 168 wide,
 *                        image 112 r14, fixed 46px text block (marginTop 7)
 *   FilterChips          7px/14px padding on 12.5 text => 31px pills, gap 8
 *
 * Shimmer: dark bars sit on the hero (base rgba(255,255,255,0.06), the
 * canonical .clb-shimmer-dark sweep lifts the peak to ~0.12); canvas bars use
 * the light sweep over A.TRACK. Nothing below the tab row shimmers — the tab
 * content is off the fold on every device we ship.
 */
import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { HERO_CONTENT_INSET, W_10 } from '@/components/profile/hero/HeroShell';

const DARK_FILL = 'rgba(255,255,255,0.06)';

/** Bar on the dark hero. */
function D({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="clb-shimmer-dark"
      style={{ backgroundColor: DARK_FILL, borderRadius: 6, ...style }}
    />
  );
}

/** Bar on the canvas. The base fill must be INLINE — the shimmer class sets
 *  the `background` shorthand and would otherwise wipe a class-based fill. */
function L({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="clb-shimmer-light"
      style={{ backgroundColor: A.TRACK, borderRadius: 6, ...style }}
    />
  );
}

function HeroSkeleton({
  headline,
  counters,
  centreCounters,
  sparkline,
}: {
  headline: boolean;
  counters: number;
  centreCounters: boolean;
  sparkline: boolean;
}) {
  return (
    <section
      style={{
        position: 'relative',
        background: A.INK,
        padding: '0 16px 16px',
        paddingTop: `calc(${HERO_CONTENT_INSET} + 18px)`,
        fontFamily: SANS,
      }}
    >
      {/* Identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <D style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <D style={{ height: 14, width: '60%' }} />
          <D style={{ height: 9, width: '40%', marginTop: 6 }} />
        </div>
        <D style={{ width: 64, height: 34, borderRadius: 999, flexShrink: 0 }} />
      </div>

      {/* Headline figure (club business / personal index). Omitted entirely on
          surfaces that have none, exactly as HeroShell omits it. */}
      {headline && (
        <div style={{ marginTop: 18 }}>
          <D style={{ height: 8, width: 104 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
            <D style={{ height: 32, width: 96, borderRadius: 8 }} />
            <D style={{ height: 11, width: 54, marginBottom: 3 }} />
          </div>
          {sparkline && (
            <D style={{ height: 42, width: '100%', borderRadius: 8, marginTop: 10 }} />
          )}
        </div>
      )}

      {/* Counter strip */}
      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${W_10}`,
          paddingTop: 13,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: centreCounters ? 'center' : undefined,
        }}
      >
        {Array.from({ length: counters }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: centreCounters ? 120 : undefined,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <D style={{ height: 15, width: 32 }} />
            <D style={{ height: 7, width: 46, marginTop: 5 }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Bio, READ MORE and the website chip — on canvas, no card. */
function BioSkeleton() {
  return (
    <section style={{ padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <L style={{ height: 11, width: '100%' }} />
        <L style={{ height: 11, width: '100%' }} />
        <L style={{ height: 11, width: '70%' }} />
      </div>
      {/* READ MORE lives inside a 44px tap box */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
        <L style={{ height: 8, width: 78 }} />
      </div>
      <L style={{ height: 44, width: 148, borderRadius: 999 }} />
    </section>
  );
}

/** Top 10 rail: 2.5 cards at the shipped 168 x (112 + 46) geometry. */
function TopTenSkeleton() {
  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <L style={{ height: 9, width: 92 }} />
          <L style={{ height: 10, width: 152, marginTop: 5 }} />
        </div>
        <L style={{ height: 9, width: 52, marginLeft: 12, flexShrink: 0 }} />
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 9,
          paddingLeft: 16,
          paddingRight: 16,
          overflow: 'hidden',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 168, flexShrink: 0 }}>
            <L style={{ height: 112, width: '100%', borderRadius: 14 }} />
            <div style={{ marginTop: 7, height: 46, overflow: 'hidden' }}>
              <L style={{ height: 11, width: '92%' }} />
              <L style={{ height: 11, width: '58%', marginTop: 5 }} />
              <L style={{ height: 9, width: '40%', marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** FilterChips row — three 31px pills, centred, gap 8. */
function TabsSkeleton({ count }: { count: number }) {
  return (
    <div
      style={{
        marginTop: 20,
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '0 16px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <L key={i} style={{ height: 31, width: 88, borderRadius: 999 }} />
      ))}
    </div>
  );
}

export interface ProfileSurfaceSkeletonProps {
  /** Headline figure block: personal index, or a club's community rating. */
  headline?: boolean;
  /** 42px sparkline under the headline — personal profile only. */
  sparkline?: boolean;
  counters?: number;
  centreCounters?: boolean;
  topTen?: boolean;
  tabs?: number;
}

export const ProfileSurfaceSkeleton: React.FC<ProfileSurfaceSkeletonProps> = ({
  headline = true,
  sparkline = false,
  counters = 4,
  centreCounters = false,
  topTen = false,
  tabs = 3,
}) => (
  <div
    aria-hidden="true"
    style={{ minHeight: '100vh', background: A.CANVAS, fontFamily: SANS }}
  >
    <HeroSkeleton
      headline={headline}
      sparkline={sparkline}
      counters={counters}
      centreCounters={centreCounters}
    />
    <BioSkeleton />
    {topTen && <TopTenSkeleton />}
    <TabsSkeleton count={tabs} />
  </div>
);

export default ProfileSurfaceSkeleton;
