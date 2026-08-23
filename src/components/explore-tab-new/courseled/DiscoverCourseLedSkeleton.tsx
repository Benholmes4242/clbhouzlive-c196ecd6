import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import {
  CARD_RADIUS,
  CARD_SHELL,
  CHIP_RADIUS,
  SCOPE_PILL_RADIUS,
  THUMBNAIL_RADIUS,
  WELL_RADIUS,
} from './tokens';
import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
  HERO_TOP_SCRIM,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

/**
 * THE ROUND TILE'S DARK REGION, MODELLED WITH THE LIVE TILE'S OWN CONSTANTS
 * (BRIEF_ROUND_TILE_HERO_TOUR_COLOUR §6). The tile's fallback is no longer the
 * near-black HERO_BASE — it is the TOUR'S COURSE_GRADIENT under COURSE_SCRIMS
 * and the two scaled scrims. A shell still painted near-black would model a
 * colour the page no longer has, so it composes the same stack at the same
 * heights rather than approximating it with a hex.
 *
 * BRIEF_ROUND_TILE_HERO_TOUR_MATCH §7: the heights are now the TOUR'S
 * PROPORTIONS against the 191px dark region (28.0% -> 53, 90.9% -> 174), and
 * the bottom layer is the tile's own inline gradient ending at FULL opacity —
 * NOT the exported HERO_BOTTOM_SCRIM, which stops at 0.92 and lets
 * COURSE_GRADIENT's sand bottom stop cast through.
 */
const SK_TILE_BOTTOM_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,1) 100%)';
const SK_ROUND_HERO_BG = [
  `${HERO_TOP_SCRIM} top / 100% 53px no-repeat`,
  `${SK_TILE_BOTTOM_SCRIM} bottom / 100% 174px no-repeat`,
  COURSE_SCRIMS,
  COURSE_GRADIENT,
].join(', ');

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
 *   rounds rail    merged Golf this week: readout + region, scope pills, the
 *                  PODIUM BAND (three 230px chips, 215 tall, 9px gap) and the
 *                  round tiles
 *   most played    four collapsed cards at 10px gaps, 52px thumbnail, with
 *                  separate region/count lines and the resolved-player BEST row
 *   honours        rail of 206 x 148 cards over a 104px person-led head
 *                  (SK_CARD_W / SK_CARD_H / SK_HEAD_H)
 * so the loaded page lands on its own outline with no section boundary
 * shifting.
 *
 * WHAT THIS SHELL COVERS, AND WHAT IT DELIBERATELY DOES NOT
 * (BRIEF_DISCOVER_SKELETON_RESYNC §0b): it draws the rounds rail, Most played
 * and the Honours board — a correct PREFIX of the live page. LATEST VIDEOS and
 * CLIPS get NO SHELL ON PURPOSE. They are the last two sections and sit below
 * the fold, and a shell with FEWER sections than the page can only ever expand
 * DOWNWARD, which is the one direction a loading state is allowed to move.

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
      style={{ backgroundColor: A.TRACK, borderRadius: CHIP_RADIUS, ...style }}
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
/**
 * BRIEF_DISCOVER_EYEBROWS §5 — the heading is now a 10px uppercase eyebrow at
 * lineHeight 1 (KICKER, matching the readout) with NO icon, so the header row is a FIXED 20 (Eyebrow sets minHeight: 20 so the aside kind cannot change it), not 15+aside, and it
 * 10px tall, not 15, and reserves no leading glyph width. Callers' `w` values
 * were measured for the old 15.5px sentence-case title; each is scaled to the
 * uppercase run it now models.
 */
function EyebrowBar({ w = 150, aside = false }: { w?: number; aside?: boolean }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 2px',
          height: 20,
        }}
      >
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
 * GOLF THIS WEEK. MEASURED off GolfThisWeek.tsx after BRIEF_ROUND_TILE_THE_MOMENT:
 * 256 wide, no border and a 1px shadow, then a 191px DARK REGION — the 156px
 * hero plus the member row, which now sits ON the photograph and its scrims
 * (BRIEF_ROUND_TILE_PHOTO_THROUGH_MEMBER_ROW, BRIEF_ROUND_TILE_HERO_TOUR_COLOUR), then the dark feed well (hairline on all four sides) at a FIXED 135px running to the
 * card's bottom edge: its header rule and the 96px two-rows-of-nine scorecard. Above the rail: the
 * count/region readout row, the pills row and the best-of-week band, all of
 * which the live section renders before its first card and none of which may
 * appear later.
 */


export function GolfThisWeekRail() {
  return (
    <section>
      {/* No heading. This section leads the page, directly under the chrome
          island, and its pills state its scope more clearly than a title would.
          Every section below it keeps the glyph-and-heading treatment. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          /* The floating header sits at sat + 10 and is 44px tall, so sat + 70
             gives 16px of clearance everywhere. THIS IS THE ONLY PLACE THE SHELL
             APPLIES IT — the default export's wrapper used to apply it again
             (BRIEF_DISCOVER_SKELETON_RESYNC §2), which started the shell ~70px
             LOW and made the page settle UPWARD. It lives here because that is
             where the live page puts it (GolfThisWeek, MICRO_BRIEF_ROUNDS_
             SECTION_CHROME S1.4), and GolfThisWeek renders this shell itself. */
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',
          marginBottom: 12,
          minWidth: 0,
        }}
      >

        {/* THE READOUT: "12 rounds · 4 courses · 7 days" at KICKER (10 / 700 /
            0.16em / uppercase) MEASURES 208 at 524px. The old 118 modelled the
            two-part string that BRIEF_DISCOVER_ORDER_AND_LABELS replaced. */}
        <Bar style={{ height: 9, width: 206 }} />
        <Bar style={{ height: 34, width: 100, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '2px 0 14px' }}>
        {[64, 74, 60, 56].map((w, i) => (
          <Bar key={i} style={{ height: 34, width: w, borderRadius: SCOPE_PILL_RADIUS }} />
        ))}
      </div>
      {/* BRIEF_BAND_TILES_PODIUM §7 — measured against a full live podium:
          eyebrow, 40px face + 34px leader figure, margin chip, hairline, and two
          compact chasers. Sparse live cards collapse, by explicit decision;
          this shell models the full state so resolving content never pushes the
          round rail downward.

          WHY THREE ROWS AND NOT ONE: in the current data
          three of the four categories clear their floor with three or more
          distinct members. A one-row shell would under-measure the common full
          state by 89px and strand the band exactly as the old strip did.
          THREE CHIPS, NOT FOUR: MOST IMPROVED renders only when a falling index
          exists, and a skeleton is never larger than the smallest settled state. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 12 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-band-podium-skeleton
            style={{
              background: A.PANEL,
              border: 'none',
              borderRadius: CARD_RADIUS,
              boxShadow: '0 1px 2px rgba(11,15,20,0.05)',
              overflow: 'hidden',
              flex: '1 0 230px',
              minWidth: 230,
              padding: '11px 12px 12px',
              boxSizing: 'border-box',
            }}
          >
            {/* The eyebrow row: label left, unit right (§2). */}
            <div
              style={{
                height: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Bar style={{ height: 8, width: 66 }} />
              <Bar style={{ height: 8, width: 26 }} />
            </div>

            {/* Leader: 40px face, 34px figure and name. */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  minHeight: 64,
                  display: 'grid',
                  gridTemplateColumns: '40px minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Bar style={{ height: 42, width: 40, borderRadius: '34%' }} />
                <div>
                  <Bar style={{ height: 31, width: 58 }} />
                  <Bar style={{ height: 10, width: 84, marginTop: 5 }} />
                </div>
              </div>
              <Bar style={{ height: 20, width: 76, marginTop: 8 }} />
              <div style={{ height: 1, background: A.HAIRLINE, marginTop: 12 }} />
              {[0, 1].map((j) => (
                <div
                  key={j}
                  style={{
                    height: 34,
                    borderTop: j === 0 ? 'none' : `1px solid ${A.HAIRLINE}`,
                    boxSizing: 'border-box',
                    display: 'grid',
                    gridTemplateColumns: '12px 16px minmax(0, 1fr) 22px 18px',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Bar style={{ height: 8, width: 7 }} />
                  <Bar style={{ height: 16, width: 16, borderRadius: '34%' }} />
                  <Bar style={{ height: 10, width: j === 0 ? 84 : 66 }} />
                  <Bar style={{ height: 10, width: 22 }} />
                  <Bar style={{ height: 9, width: 18 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>



      <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              ...CARD_SHELL,
              width: 256,
              flexShrink: 0,
              padding: 0,
              /* The live card lost its border for a shadow
                 (BRIEF_ROUND_TILE_LIGHT_REFINEMENT §S1.5) — so does its
                 placeholder, or the first frame outlines a card the second
                 frame does not. */
              border: 'none',
              boxShadow: '0 1px 2px rgba(11,15,20,0.05)',
            }}
          >
            {/* THE DARK REGION, 191 = the 156 hero + the member row's 8/19/8
                (BRIEF_ROUND_TILE_PHOTO_THROUGH_MEMBER_ROW §4). The live tile's
                photograph and scrim now run behind the row, so the shell's dark
                block extends and the row's bars sit ON it rather than below it.
                A skeleton updated later is a skeleton that is already wrong. */}
            <div
              style={{
                height: 191,
                width: '100%',
                background: SK_ROUND_HERO_BG,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '8px 10px 8px',
                boxSizing: 'border-box',
              }}
            >
              {/* The member row carries the score. A.TRACK would vanish on this
                  fill, so the bars take a white at 16%. */}
              <div style={{ height: 19, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bar
                  style={{
                    height: 19,
                    width: 19,
                    borderRadius: '34%',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                  }}
                />
                <Bar
                  style={{ height: 11, width: 92, backgroundColor: 'rgba(255,255,255,0.16)' }}
                />
                <Bar
                  style={{
                    height: 12,
                    width: 34,
                    marginLeft: 'auto',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                  }}
                />
              </div>
            </div>
            <div style={{ padding: '0 10px 0' }}>
              {/* THE DARK FEED WELL (BRIEF_DARK_ONLY_PART_B §2.2): header, its one
                  rule, and the FIXED 96px scorecard region — the same height on
                   every card, running to the card's bottom edge, with the same
                   dark hairline inset on all four sides as the live tile. */}
              <div
                style={{
                  /* THE WELL'S 8px OFFSET MOVED UP INTO THE DARK REGION'S BOTTOM
                     PADDING (BRIEF_ROUND_TILE_PHOTO_THROUGH_MEMBER_ROW §1) — the row's 8/8
                     now sits inside the dark block, so keeping a margin here as well would
                     add 8px to the tile. The total height is unchanged. */
                  marginTop: 0,
                  marginLeft: -10,
                  marginRight: -10,
                  /* 139 + THE SHAPE's 53 (BRIEF_ROUND_TILE_CURVE §5). The live
                     tile grew by the curve and its eyebrow; the shell grows in
                     the same pass or the first frame is the wrong height. */
                  height: 192,
                  background: 'rgba(11,13,16,0.66)',
                  boxShadow: `inset 0 0 0 1px ${A.HAIRLINE}`,
                   borderRadius: `0 0 ${WELL_RADIUS}px ${WELL_RADIUS}px`,
                  padding: '6px 6px 9px',
                  boxSizing: 'border-box',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 6,
                    borderBottom: `1px solid ${A.HAIRLINE}`,
                  }}
                >
                  <Bar style={{ height: 8, width: 54 }} />
                  <Bar style={{ height: 8, width: 66 }} />
                </div>
                {/* THE SHAPE's region, 53 = 4 + curve 49. NO EYEBROW — the live
                    tile dropped it and the curve took the space. A FLAT ROW, not a
                    fake curve: the shell states the height, nothing about content. */}
                <div style={{ height: 53, paddingTop: 4, boxSizing: 'border-box' }}>
                  <div style={{ height: 49, display: 'flex', alignItems: 'center' }}>
                    <Bar style={{ height: 2, width: '100%' }} />
                  </div>
                </div>
                <div
                  style={{
                    height: 96,
                    marginTop: 7,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  {/* TWO ROWS OF NINE at the live 17px cell / 9px gap. */}
                  {[0, 1].map((nine) => (
                    <div key={nine}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Bar style={{ height: 8, width: 20 }} />
                        <Bar style={{ height: 8, width: 34 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}>
                        {Array.from({ length: 9 }, (_, c) => (
                          <Bar
                            key={c}
                            style={{ height: 17, width: 17, borderRadius: 999 }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        ))}
      </div>
      {/* See-all placeholder sits below the first card and does NOT scroll. */}
      <div style={{ marginTop: 8, width: 256 }}>
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
      <EyebrowBar w={132} aside />
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
      <EyebrowBar w={109} aside />
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

/** Section 6 — Most Played. This models the COLLAPSED card, never its board. */
export function MostPlayedPanel() {
  return (
    <section>
      <EyebrowBar w={189} aside />
      {/* COURSE CARD FACEPILE §6 — FIVE SEPARATE CARDS with
          the same 10px gap, or the section settles from one panel into four on
          every cold load. */}
      <div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: '6px 13px 5px',
              /* 101px: shorter than the prior measured 124px shell. */
              height: 101,
              boxSizing: 'border-box',
              background: A.PANEL,
              borderRadius: CARD_RADIUS,
              boxShadow: '0 1px 2px rgba(11,15,20,0.05)',
              marginBottom: 10,
            }}
          >
            {/* NO RANK BAR (BRIEF_MOST_PLAYED_LEADERBOARD §S1.2) and a 52px
                thumbnail to match the shipped header row. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Bar style={{ height: 52, width: 52, borderRadius: THUMBNAIL_RADIUS, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  height: 34,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <TextBar w={130} h={13} />
                <TextBar w={92} h={13} />
              </div>
              <div style={{ height: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
                <TextBar w={48} h={11} />
                <Bar style={{ width: 2.5, height: 2.5, borderRadius: '50%' }} />
                <TextBar w={52} h={11} />
              </div>
              </div>
              <Bar style={{ height: 15, width: 15, marginLeft: 'auto', flexShrink: 0 }} />
            </div>
            <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${A.HAIRLINE}`, display: 'grid', gridTemplateColumns: '102px minmax(0,1fr) 34px', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[0, 1, 2, 3, 4].map((face) => (
                  <Bar key={face} style={{ width: 26, height: 26, marginLeft: face === 0 ? 0 : -7, borderRadius: '34%', boxShadow: `0 0 0 ${face === 0 ? 2 : 1.5}px ${A.PANEL}` }} />
                ))}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TextBar w={21} h={18} />
                  <TextBar w={15} h={10} />
                  <TextBar w={46} h={10} />
                </div>
                <Bar style={{ height: 7, width: 66, marginTop: 4 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <TextBar w={26} h={11} />
                <TextBar w={24} h={7} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Section 7 — honours board (BRIEF_HONOURS_PERSON_LED): heading, the rarity
 * subline, then a RAIL OF EQUAL CARDS bled off the right edge. NO MODE TOGGLE —
 * the toggle moved into the see-all sheet — and NO PHOTO BAND: the card leads
 * with the member over a metal head. Values are literals here on purpose:
 * HonoursBoard imports this shell, so this leaf must not import back from it
 * (card 206 x 148, head 104).
 */
const SK_CARD_W = 206;
const SK_CARD_H = 148;
const SK_HEAD_H = 104;
const SK_PLATINUM_GROUND = 'linear-gradient(145deg, #FAFCFF 0%, #D7DEE8 52%, #929EAD 100%)';
const SK_GOLD_GROUND = 'linear-gradient(145deg, #FFF1A8 0%, #FFD200 52%, #C98700 100%)';

export function HonoursPanel() {
  return (
    <section>
      <div style={{ padding: '0 2px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextBar w={148} h={14} />
          <div style={{ marginLeft: 'auto' }}>
            <TextBar w={44} h={10} />
          </div>
        </div>
        <div style={{ marginTop: 5, marginLeft: 22 }}>
          <TextBar w={228} h={11} />
        </div>
        <div style={{ marginTop: 4, marginLeft: 22 }}>
          <TextBar w={172} h={11} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '3px 0 6px 2px', overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: SK_CARD_W,
              height: SK_CARD_H,
              flex: 'none',
              borderRadius: CARD_RADIUS,
              background: A.PANEL,
              boxShadow: '0 1px 3px rgba(11,15,20,0.06)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                height: SK_HEAD_H,
                position: 'relative',
                background: i === 0 ? SK_PLATINUM_GROUND : SK_GOLD_GROUND,
                padding: '11px 12px 12px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 6,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 11,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Bar style={{ height: 8, width: i === 0 ? 58 : 24 }} />
                <Bar style={{ height: 8, width: 26 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bar style={{ height: 46, width: 44, borderRadius: '34%', flexShrink: 0 }} />
                <div>
                  <TextBar w={102} h={15} />
                  <div style={{ marginTop: 5 }}>
                    <TextBar w={112} h={11} />
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: SK_CARD_H - SK_HEAD_H,
                padding: '0 12px',
                boxSizing: 'border-box',
              }}
            >
              <TextBar w={112} h={13} />
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
          page title are both gone, so the first shell is the rounds rail.
          NO VERTICAL PADDING HERE (BRIEF_DISCOVER_SKELETON_RESYNC §2). This
          mirrors ExploreTabContent's wrapper, which is `padding: '0 14px'`; the
          safe-area padding belongs to GolfThisWeekRail's first row, exactly as
          the live page keeps it inside GolfThisWeek. Applying it in both places
          started the shell ~70px low and settled the page UPWARD. */}
      <div style={{ padding: '0 14px' }}>

        <GolfThisWeekRail />
      </div>

      {/* THE LIVE PAGE ENDS ON A FLAT 28 (BRIEF_DISCOVER_ORDER_AND_LABELS): the
          rounds section carries marginBottom 28 and ExploreTabContent's column
          runs on gap 28, with the old 10px first group and the videos rail's
          +16px correction both removed. So this flat 28 already matches. */}
      <div
        style={{
          padding: '0 14px',
          marginTop: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >



        {/* MomentsMosaic is NO LONGER REACHED FROM DISCOVER
            (MICRO_BRIEF_REMOVE_MOMENTS_FROM_DISCOVER): the section was
            unmounted from the page. The export STAYS — MomentsOfTheWeek still
            renders it as its own pending shell on the Community page. */}
        <MostPlayedPanel />

        <HonoursPanel />
      </div>
    </div>
  );
}
