/**
 * TOUR HUB OVERVIEW — page silhouette (BRIEF_SKELETON_AUDIT_DISCOVER_AND_TOUR B).
 *
 * THE RULE, AND IT OUTRANKS EVERY MEASUREMENT BELOW (A5):
 *   A SKELETON BLOCK IS UPDATED IN THE SAME PASS AS THE SECTION IT STANDS IN
 *   FOR, NEVER AS A LATER TIDY-UP.
 *
 * Modelled on DiscoverCourseLedSkeleton: one page-level outline, blocks in the
 * order OverviewPageV3 ACTUALLY RENDERS them, every block MEASURED on the
 * rendered section at 390px rather than added up off the JSX.
 *
 * VERIFIED LIVE RENDER ORDER (re-verified against OverviewPageV3 at HEAD):
 *   OverviewHero, VenueRecordBand, ComingUpSlot, WorldRankingsSlot,
 *   StatWatchSlot, CourseOfTheWeekSection, CollegeFranchise,
 *   ConnectHandicapCue.
 *
 * ComingUp and WorldRankings were REMOUNTED after the audit that removed their
 * holds, so both are drawn again. MEASURED LIVE at 390px: ComingUp 658 after the
 * inline-badge amendment (three-line rows at 112; hold 624 — deliberately 34
 * short; a hold may be smaller than the settled state, never larger) and
 * WorldRankings 353 (exact).
 *
 * ONLY THE CERTAIN SECTIONS ARE DRAWN (B4). A silhouette that draws a section
 * which then does not appear is worse than no silhouette, because the page
 * collapses upward and everything below jumps.
 *
 *   CERTAIN     hero (always mounts and holds its own height).
 *   CONDITIONAL VenueRecordBand (no rating/rank -> null), so it draws NOTHING
 *               and appears only when it resolves.
 *   NOT A LOAD  ConnectHandicapCue is a gate, not a loading state (B6).
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_TINT_06 } from '@/features/tourhub/_shared/tokens';
import { OVERVIEW_STRIP_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';

/**
 * Shimmer block. The base fill is INLINE because `.clb-shimmer-dark` sets the
 * `background` shorthand, which would otherwise wipe out a `bg-*` utility class
 * and leave the bars invisible on the canvas. Do not "tidy" it away.
 */
function Bar({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="clb-shimmer-dark" style={{ backgroundColor: A.TRACK, borderRadius: 6, ...style }} />
  );
}

/** Section head: the KICKER line box measures 17 and the subline 28. */
function Head({ w = 150, sub = 210 }: { w?: number; sub?: number }) {
  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ height: 17, display: 'flex', alignItems: 'center' }}>
        <Bar style={{ height: 10, width: w }} />
        <Bar style={{ height: 10, width: 82, marginLeft: 'auto' }} />
      </div>
      <div style={{ height: 28, display: 'flex', alignItems: 'center' }}>
        <Bar style={{ height: 11, width: sub }} />
      </div>
    </div>
  );
}

/**
 * WHAT'S COMING UP — head (17 + 28) over a 624 table body, plus the pager dots.
 *
 * REMEASURED for the AMENDMENT to MICRO_BRIEF_COMING_UP_REBUILD: the tour badge
 * moved INLINE with the name and the playoffs chip was removed, so each event is
 * THREE lines and MEASURES 112 LIVE at 390 (was 138). The settled track is 658
 * (five 112 rows + three 32 group headers). The hold draws two group headers and
 * five rows = 624, deliberately 34 SHORT: a hold may be smaller than the settled
 * state, never larger, and the group count varies with the fixture list.
 */
function ComingUpBlock() {
  return (
    <section>
      <Head w={158} sub={228} />
      <div style={{ padding: '0 16px' }}>
        <div style={{ height: 624, display: 'flex', flexDirection: 'column' }}>
          {[0, 1].map((g) => (
            <div key={g} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* group header — 32 */}
              <div
                style={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '0 14px',
                }}
              >
                <Bar style={{ height: 10, width: 54 }} />
                <Bar style={{ height: 10, width: 72 }} />
              </div>
              {/* rows — 112 each; 3 under the first header, 2 under the second */}
              {(g === 0 ? [0, 1, 2] : [0, 1]).map((i) => (
                <div
                  key={i}
                  style={{
                    height: 112,
                    boxSizing: 'border-box',
                    padding: '11px 14px 12px',
                    borderTop: i === 0 ? 'none' : `1px solid ${A.BORDER}`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* line 1 — name with the tour badge beside it */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bar style={{ height: 16, width: '58%' }} />
                    <Bar style={{ height: 15, width: 40 }} />
                  </div>
                  <Bar style={{ height: 12, width: '44%', marginTop: 5 }} />

                  <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Bar style={{ height: 10, width: 40 }} />
                      <Bar style={{ height: 12, width: 34 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Bar style={{ height: 10, width: 52 }} />
                      <Bar style={{ height: 12, width: 46 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* The pager dots close the section: marginTop 10 over 6px dots. */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <Bar key={i} style={{ height: 6, width: 6, borderRadius: 999 }} />
          ))}
        </div>
      </div>
    </section>
  );
}


/** The per-section tour lens above WORLD RANKINGS renders at 52. */
function LensRow() {
  return (
    <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', overflow: 'hidden' }}>
      {[74, 82, 96, 70, 88].map((w, i) => (
        <Bar key={i} style={{ height: 30, width: w, borderRadius: 999, flexShrink: 0 }} />
      ))}
    </div>
  );
}

/**
 * WORLD RANKINGS — head (45), an 81 hero row (62 avatar + figures), then four
 * two-line pack rows at 59. 362, measured against the resolved section at 390
 * (363) after the flag / wins / top-10 / points-bar enrichment. A hold may never
 * exceed the state it resolves into, so this sits 1 under, not over.
 */
function WorldRankingsBlock() {
  return (
    <section>
      <Head w={144} sub={196} />
      <div style={{ padding: '0 16px' }}>
        <div style={{ height: 81, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Bar style={{ height: 62, width: 62, borderRadius: 20, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bar style={{ height: 10, width: 96 }} />
            <Bar style={{ height: 17, width: '52%' }} />
            <Bar style={{ height: 10, width: 104 }} />
          </div>
          <Bar style={{ height: 28, width: 56 }} />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 59,
              borderTop: `1px solid ${A.BORDER}`,
              boxSizing: 'border-box',
            }}
          >
            <Bar style={{ height: 12, width: 14 }} />
            <Bar style={{ height: 34, width: 34, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bar style={{ height: 13, width: '46%' }} />
              <Bar style={{ height: 9, width: '30%' }} />
            </div>
            <Bar style={{ height: 13, width: 38 }} />
          </div>
        ))}
      </div>
    </section>
  );
}


export const TourHubOverviewSkeleton = () => {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      {/* Hero — MUST mirror the mounted OverviewHero.isLoading hold exactly, so
          chunk-load -> hero-loading -> hero is one continuous frame. */}
      <div
        style={{
          height: OVERVIEW_STRIP_TOTAL_HEIGHT,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${INK_TINT_06}, ${A.CANVAS})`,
        }}
      />
      {/* VenueRecordBand stays undrawn (conditional). Schedule + rankings
          are mounted again and reserve their measured heights. */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ComingUpBlock />
        <WorldRankingsBlock />
      </div>
    </div>
  );
};

export default TourHubOverviewSkeleton;
