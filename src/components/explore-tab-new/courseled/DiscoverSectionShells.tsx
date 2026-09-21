import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CARD_SHELL, CHIP_RADIUS } from './tokens';

/**
 * SECTION SHELLS THAT ARE NOT DISCOVER'S.
 *
 * BRIEF_DISCOVER_SKELETON_REBUILD S2.1: Discover's own skeleton no longer
 * models any of the sections below — they were unmounted from that page long
 * ago. They STAY because the components that own them (FriendsPlayedRail,
 * OnTourThisWeek, LatestReviews, MomentsOfTheWeek) still render them as their
 * own pending shells on other routes, and a shell deleted out from under a live
 * component is a worse problem than an unreached one. They live here rather
 * than inside Discover's skeleton so that file can be what the brief asks: a
 * fraction of its old size, modelling only the page that exists.
 */

/**
 * Shimmer block. The base fill is INLINE because `.clb-shimmer-light` sets the
 * `background` shorthand, which would otherwise wipe out a `bg-*` utility class
 * and leave the bars invisible on the canvas.
 */
export function Bar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`clb-shimmer-light ${className ?? ''}`}
      style={{ backgroundColor: A.TRACK, borderRadius: CHIP_RADIUS, ...style }}
    />
  );
}

/**
 * BRIEF_DISCOVER_EYEBROWS §5 — a 10px uppercase eyebrow at lineHeight 1 with no
 * icon, plus the subline that follows it: a fixed 20 + 19.
 */
function EyebrowBar({ w = 150, aside = false }: { w?: number; aside?: boolean }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', height: 20 }}>
        <Bar style={{ height: 9, width: w }} />
        {aside ? <Bar style={{ height: 9, width: 44, marginLeft: 'auto' }} /> : null}
      </div>
      <div style={{ height: 19, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
        <Bar style={{ height: 10, width: 196 }} />
      </div>
    </>
  );
}

function TextBar({ w, h = 11 }: { w: number | string; h?: number }) {
  return <Bar style={{ height: h, width: w }} />;
}

/**
 * Friends rail. MEASURED off FriendsPlayedRail: 224 wide, a 90px photograph
 * carrying the glass score chip, the full-bleed round shape strip at 52, then
 * the body — ONE reserved insight line, a hairline, and the member row.
 */
export function FriendsRail() {
  return (
    <section>
      <EyebrowBar w={87} aside />
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...CARD_SHELL, width: 224, flexShrink: 0, padding: 0 }}>
            <Bar style={{ borderRadius: 0, height: 90, width: '100%' }} />
            {/* The shape strip is full bleed and sits directly under the photo. */}
            <Bar style={{ borderRadius: 0, height: 52, width: '100%' }} />
            <div style={{ padding: '7px 11px 8px' }}>
              <div style={{ minHeight: 15, display: 'flex', flexDirection: 'column' }}>
                <TextBar w={'92%'} h={10} />
              </div>
              <div
                style={{
                  marginTop: 6,
                  borderTop: `1px solid ${A.BORDER}`,
                  paddingTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  height: 22,
                  boxSizing: 'border-box',
                }}
              >
                <TextBar w={96} h={13} />
                <TextBar w={22} h={13} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Tour rail: FULL-BLEED photograph tiles, 266x210, with the dark glass
 * leaderboard panel inset 8px from the left, right and bottom.
 */
export function TourRail() {
  return (
    <section>
      <EyebrowBar w={132} aside />
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{ ...CARD_SHELL, position: 'relative', width: 266, height: 210, flexShrink: 0 }}
          >
            <Bar style={{ borderRadius: 0, height: '100%', width: '100%' }} />
            <div
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                bottom: 8,
                borderRadius: 11,
                background: 'rgba(11,15,19,0.30)',
                padding: '8px 10px 9px',
                boxSizing: 'border-box',
              }}
            >
              <Bar style={{ height: 23, width: 74, backgroundColor: 'rgba(255,255,255,0.22)' }} />
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[0, 1, 2].map((r) => (
                  <Bar
                    key={r}
                    style={{
                      height: 11,
                      width: r === 2 ? '72%' : '88%',
                      backgroundColor: 'rgba(255,255,255,0.18)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * LATEST REVIEWS mosaic: two columns with an 8px gap, two tiles of 265.
 */
export function ReviewsMosaic() {
  return (
    <section>
      <EyebrowBar w={109} aside />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0, 1].map((i) => (
          <Bar key={i} style={{ height: 265, borderRadius: 14 }} />
        ))}
      </div>
    </section>
  );
}

/**
 * Moments mosaic: BLOCK ROWS of `tall` (220) with a 2px gutter, finishing on a
 * trailing row of SHORTS where SHORT = (tall - gap) / 2 = 109.
 */
export function MomentsMosaic() {
  return (
    <section>
      <EyebrowBar w={154} aside />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[0, 1].map((b) => (
          <div key={b} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Bar
              style={{
                height: 220,
                borderRadius: 14,
                gridColumn: b % 2 === 0 ? 1 : 2,
                gridRow: '1 / span 2',
              }}
            />
            <Bar style={{ height: 109, borderRadius: 14, gridColumn: b % 2 === 0 ? 2 : 1, gridRow: 1 }} />
            <Bar style={{ height: 109, borderRadius: 14, gridColumn: b % 2 === 0 ? 2 : 1, gridRow: 2 }} />
          </div>
        ))}
        {/* The trailing shorts row: cap 8 never divides into whole blocks. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Bar style={{ height: 109, borderRadius: 14 }} />
          <Bar style={{ height: 109, borderRadius: 14 }} />
        </div>
      </div>
    </section>
  );
}
