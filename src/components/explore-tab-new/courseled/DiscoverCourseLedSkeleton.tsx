import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CARD_SHELL } from './tokens';

/**
 * DISCOVER, COURSE-LED — loading silhouette.
 *
 * THE RULE, AND IT OUTRANKS EVERY MEASUREMENT BELOW
 * (BRIEF_SKELETON_AUDIT_DISCOVER_AND_TOUR A5):
 *   A SKELETON BLOCK IS UPDATED IN THE SAME PASS AS THE SECTION IT STANDS IN
 *   FOR, NEVER AS A LATER TIDY-UP. A skeleton written a week after its section
 *   is a skeleton that is already wrong.
 *
 * Every block below is MEASURED off the rendered component it stands in for,
 * not read off the JSX and added up:
 *   rounds rail    merged Golf this week: heading + scope pills + band + tiles
 *   around world   masonry, six photo heights + 62 body
 *   moments        two 220 blocks + a trailing 109 shorts row (cap 8)
 *   most played    panel of 60px rows
 *   honours        rail of 168 x 178 plaques (HonoursBoard PLAQUE_W / PLAQUE_H)
 * so the loaded page lands on its own outline with no section boundary
 * shifting.
 *
 * NO LONGER REACHED FROM DISCOVER (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL):
 * TourRail and ReviewsMosaic. Both sections were unmounted from this page, so
 * neither shell can appear on it any more. The exports STAY because they are
 * rendered by OnTourThisWeek and LatestReviews themselves — those components
 * are intact by instruction (S1.2), and a shell deleted out from under a live
 * component is a worse problem than an unreached one.
 *
 * ALSO NO LONGER REACHED (MICRO_BRIEF_REMOVE_ONE_THING_ROW): the page header
 * block (title removed) and FriendsRail (merged into the rounds rail). The rate
 * prompt never had a shell here, so nothing had to be deleted for it. The
 * merged rounds rail now LEADS the shell and owns the safe-area padding.
 */




/**
 * Shimmer block. The base fill is INLINE because `.clb-shimmer-light` sets the
 * `background` shorthand, which would otherwise wipe out a `bg-*` utility class
 * and leave the bars invisible on the canvas.
 */
function Bar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`clb-shimmer-light ${className ?? ''}`}
      style={{ backgroundColor: A.TRACK, borderRadius: 6, ...style }}
    />
  );
}

/**
 * Section head. MEASURED on every live section: the KICKER line box is 15 and
 * the SUBLINE that follows it occupies 19, so the head is 34 and the body
 * starts exactly where the live one does. The old 15 + a 10px gap made EVERY
 * block on the page nine pixels short, which is why the whole page used to
 * settle upward by 9 on load.
 */
function EyebrowBar({ w = 150, aside = false }: { w?: number; aside?: boolean }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 2px',
          height: 15,
        }}
      >
        <Bar style={{ height: 10, width: w }} />
        {aside ? <Bar style={{ height: 10, width: 44, marginLeft: 'auto' }} /> : null}
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
 * Section 2 — friends rail. MEASURED off FriendsPlayedRail: 224 wide, a 90px
 * photograph (PHOTO_H) carrying the glass score chip, the full-bleed round
 * shape strip at 52 (SHAPE_H), then the body — ONE reserved insight line
 * (INSIGHT_LINE_RESERVE ~15), a hairline, and the member/reaction row.
 * Total 208. The strip grew 34 -> 60 -> 52 so the curve stays legible while the
 * tile is condensed.
 */
export function FriendsRail() {
  return (
    <section>
      <EyebrowBar w={168} aside />
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
 * GOLF THIS WEEK (BRIEF_GOLF_THIS_WEEK acceptance M). MEASURED off
 * GolfThisWeek.tsx: 236 wide, a 92px photograph carrying the course name, then
 * the body — score row 24, member row 22, the full-bleed shape strip at 48
 * (SHAPE_H), one insight line. Above the rail: eyebrow + subline, the live count
 * line, the pills row and the best-of-week band, all of which the live section
 * renders before its first card and none of which may appear later.
 */
export function GolfThisWeekRail() {
  return (
    <section>
      <EyebrowBar w={132} aside />
      <div style={{ height: 15, display: 'flex', alignItems: 'center', padding: '0 2px', marginBottom: 10 }}>
        <Bar style={{ height: 9, width: 118 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '2px 0 14px' }}>
        {[64, 74, 60, 56].map((w, i) => (
          <Bar key={i} style={{ height: 34, width: w, borderRadius: 999 }} />
        ))}
      </div>
      <div
        style={{
          borderTop: `1px solid ${A.BORDER}`,
          borderBottom: `1px solid ${A.BORDER}`,
          padding: '9px 0 10px',
          marginBottom: 12,
          display: 'flex',
          gap: 8,
        }}
      >
        <Bar style={{ height: 10, width: 82 }} />
        <Bar style={{ height: 10, width: 150 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...CARD_SHELL, width: 236, flexShrink: 0, padding: 0 }}>
            <Bar style={{ borderRadius: 0, height: 92, width: '100%' }} />
            <div style={{ padding: '9px 11px 9px' }}>
              <div style={{ height: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TextBar w={46} h={18} />
                <TextBar w={26} h={12} />
                <div style={{ marginLeft: 'auto' }}>
                  <TextBar w={38} h={12} />
                </div>
              </div>
              <div
                style={{
                  marginTop: 7,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Bar style={{ height: 22, width: 22, borderRadius: '34%' }} />
                <TextBar w={92} h={11} />
              </div>
              <div style={{ marginTop: 6, marginLeft: -11, marginRight: -11 }}>
                <Bar style={{ borderRadius: 0, height: 60, width: '100%' }} />
                <div style={{ padding: '7px 11px 0' }}>
                  <Bar style={{ height: 5, width: '100%', borderRadius: 3 }} />
                </div>
                <div style={{ padding: '4px 11px 0', height: 13, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  {[30, 22, 26, 32].map((w) => (
                    <Bar key={w} style={{ height: 9, width: w }} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 4, height: 15, display: 'flex', alignItems: 'flex-end' }}>
                <TextBar w={'88%'} h={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* See-all placeholder sits below the first card and does NOT scroll. */}
      <div style={{ marginTop: 8, width: 236 }}>
        <TextBar w={110} h={10} />
      </div>
    </section>
  );
}

/**

 * Section 3 — tour rail: FULL-BLEED photograph tiles, 266x210, with the dark
 * glass leaderboard panel inset 8px from the left, right and bottom
 * (OnTourThisWeek TILE_W / TILE_H). Was 272x174 (100 image + 56 stat row + 18
 * meta line) against the superseded ~170px budget; if this stayed there the
 * rail would visibly resize on load.
 */
export function TourRail() {
  return (
    <section>
      <EyebrowBar w={140} aside />
      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{ ...CARD_SHELL, position: 'relative', width: 266, height: 210, flexShrink: 0 }}
          >
            <Bar style={{ borderRadius: 0, height: '100%', width: '100%' }} />
            {/* The glass panel's footprint: three position rows under a lead
                figure, padded 8/10/9 inside a 11px radius. */}
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
 * Slot 3 — LATEST REVIEWS mosaic. MEASURED on the rendered section: two
 * columns with an 8px gap, GRID_CAP = 2 tiles (LatestReviews.tsx), each
 * measuring 265 tall — REVIEW_TILE_HEIGHT (186) is the PHOTO, not the tile, so
 * the old 172 x 6 shell was both the wrong height and the wrong count.
 *
 * There is NO featured shell: the skeleton cannot know whether a featured review
 * exists, and a shell for one that never arrives would be a bigger visual jump
 * than the one being fixed. Two bars is the floor; content growing by one tile
 * is the acceptable direction.
 */
export function ReviewsMosaic() {
  return (
    <section>
      <EyebrowBar w={126} aside />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0, 1].map((i) => (
          <Bar key={i} style={{ height: 265, borderRadius: 14 }} />
        ))}
      </div>
    </section>
  );
}

/** Section 4 — around the world: pill row, then one card (128px image + 3 rows). */
export function AroundTheWorldCard({ pills }: { pills?: React.ReactNode } = {}) {
  return (
    <section>
      <EyebrowBar w={132} aside />
      {pills !== undefined ? (
        pills
      ) : (

      <div
        style={{
          margin: '0 -14px 12px',
          padding: '12px 16px',
          display: 'flex',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {[64, 78, 56, 92, 70].map((w, i) => (
          <Bar
            key={i}
            style={{ height: 34, width: w, borderRadius: 999, flexShrink: 0 }}
          />

        ))}
      </div>
      )}

      {/* MASONRY SHELL — same two columns, same six photo heights and the same
          shortest-column walk as the live section, so the swap does not move
          the page. Unresolved is not absent. */}
      {(() => {
        const heights = [198, 160, 138, 122, 114, 108];
        const cols: number[][] = [[], []];
        const totals = [0, 0];
        heights.forEach((h) => {
          const c = totals[0] <= totals[1] ? 0 : 1;
          cols[c].push(h);
          totals[c] += h + 62 + (cols[c].length > 1 ? 8 : 0);
        });
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {cols.map((col, ci) => (
              <div
                key={ci}
                style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {col.map((h, i) => (
                  <div key={i} style={{ ...CARD_SHELL, padding: 0 }}>
                    <Bar style={{ borderRadius: 0, height: h, width: '100%' }} />
                    <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <TextBar w={96} h={12} />
                      <TextBar w={128} h={10} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

    </section>
  );
}

/**
 * Section 5 — moments mosaic. MEASURED on the rendered section: MomentsGrid
 * lays out BLOCK ROWS of `tall` (220) with a 2px gutter, and finishes on a
 * trailing row of SHORTS where SHORT = (tall - gap) / 2 = 109. At cap 8 that
 * renders 220 / 220 / 109, which is what this draws.
 *
 * BRIEF_COMMUNITY_CREATOR_CARDS changes nothing here: a creator card occupies a
 * TALL slot and is exactly `tall`, so the block rows keep their heights and the
 * silhouette does not need to tell a card from a tile.
 */
export function MomentsMosaic() {
  return (
    <section>
      <EyebrowBar w={142} aside />
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

/** Section 6 — most played: panel of rows (rank + 40px thumb + bars + figure). */
export function MostPlayedPanel() {
  return (
    <section>
      <EyebrowBar w={152} aside />
      <div style={{ ...CARD_SHELL, padding: '4px 14px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '10px 0',
              borderBottom: i === 2 ? 'none' : `1px solid ${A.BORDER}`,
            }}
          >
            <TextBar w={14} h={12} />
            <Bar style={{ height: 40, width: 40, borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <TextBar w={130} h={13} />
              <TextBar w={72} h={11} />
            </div>
            <TextBar w={26} h={15} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Section 7 — honours board (BRIEF_HONOURS_BOARD_REBUILD): CANVAS-NATIVE. No
 * gold wash, no gold hairline, no tinted panel — a kicker line with the mode
 * toggle top right, headline, subline, then a RAIL of photo-band cards bled off
 * the right edge. Values are literals here on purpose: HonoursBoard imports this
 * shell, so this leaf must not import back from it (card 212 x 132 band + footer).
 */
const SK_CARD_W = 212;
const SK_BAND_H = 132;

export function HonoursPanel() {
  return (
    <section>
      <div style={{ padding: '0 2px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextBar w={128} h={10} />
          <div style={{ marginLeft: 'auto' }}>
            <Bar style={{ height: 24, width: 118, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ marginTop: 6 }}>
          <TextBar w={166} h={16} />
        </div>
        <div style={{ marginTop: 3 }}>
          <TextBar w={112} h={11} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingLeft: 2, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: SK_CARD_W,
              flex: 'none',
              borderRadius: 16,
              border: `1px solid ${A.BORDER}`,
              background: '#FFFFFF',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <Bar style={{ height: SK_BAND_H, width: '100%', borderRadius: 0 }} />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px' }}
            >
              <Bar style={{ height: 20, width: 20, borderRadius: 7, flexShrink: 0 }} />
              <TextBar w={94} h={12} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


export default function DiscoverCourseLedSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS }}
    >
      {/* THE MERGED ROUNDS SECTION LEADS THE PAGE
          (MICRO_BRIEF_REMOVE_ONE_THING_ROW S1.3 / S2.2): the rate prompt and the
          page title are both gone, so the first shell is the rounds rail and it
          carries the live page's padding verbatim — the floating header sits at
          sat + 10 and is 44px tall, so sat + 70 gives 16px of clearance on
          notched and non-notched devices alike. */}
      <div
        style={{
          padding: '0 14px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',
        }}
      >
        <GolfThisWeekRail />
      </div>

      <div
        style={{
          padding: '0 14px',
          marginTop: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >


        <MomentsMosaic />
        <MostPlayedPanel />
        <HonoursPanel />
      </div>
    </div>
  );
}
