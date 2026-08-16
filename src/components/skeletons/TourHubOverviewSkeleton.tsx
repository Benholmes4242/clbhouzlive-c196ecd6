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
 * RENDER ORDER, read off the JSX:
 *   OverviewHero, VenueRecordBand, TISlot, ComingUpSlot, WorldRankingsSlot,
 *   StatWatchSlot, CourseOfTheWeekSection, CollegeFranchise,
 *   ConnectHandicapCue.
 *
 * ONLY THE CERTAIN SECTIONS ARE DRAWN (B4). A silhouette that draws a section
 * which then does not appear is worse than no silhouette, because the page
 * collapses upward and everything below jumps.
 *
 *   CERTAIN     hero (always mounts, holds its own height), ComingUp (459) with
 *               its tour-lens pill row (52), WorldRankings (353) — both boards
 *               are populated year-round for the default PGA lens and neither
 *               is gated on a live tournament.
 *   CONDITIONAL VenueRecordBand (no rating/rank -> null), TISlot (no tournament
 *               or no picks -> null), StatWatch (SG coverage is PGA-only and it
 *               self-hides on no data), CourseOfTheWeek (hides on error/empty),
 *               CollegeFranchise (hides with no leader/chaser pair).
 *               These draw NOTHING and appear when they resolve.
 *   NOT A LOAD  ConnectHandicapCue is a gate, not a loading state (B6).
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_TINT_06 } from '@/features/tourhub/_shared/tokens';
import { OVERVIEW_HERO_TOTAL_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';
import { SPACE } from '@/lib/spacing';

/**
 * Shimmer block. The base fill is INLINE because `.clb-shimmer-light` sets the
 * `background` shorthand, which would otherwise wipe out a `bg-*` utility class
 * and leave the bars invisible on the canvas. Do not "tidy" it away.
 */
function Bar({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="clb-shimmer-light" style={{ backgroundColor: A.TRACK, borderRadius: 6, ...style }} />
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

/** WHAT'S COMING UP — head (17 + 28) over a 399 table body, 459 total. */
function ComingUpBlock() {
  return (
    <section>
      <Head w={158} sub={228} />
      <div style={{ padding: '0 16px' }}>
        <div style={{ height: 399, display: 'flex', flexDirection: 'column' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 57,
                borderBottom: i === 6 ? 'none' : `1px solid ${A.BORDER}`,
                boxSizing: 'border-box',
              }}
            >
              <Bar style={{ height: 30, width: 44 }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bar style={{ height: 12, width: '58%' }} />
                <Bar style={{ height: 10, width: '38%' }} />
              </div>
              <Bar style={{ height: 13, width: 30 }} />
            </div>
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

/** WORLD RANKINGS — head (17 + 28), a 73 lead row, then hairline rows. 353. */
function WorldRankingsBlock() {
  return (
    <section>
      <Head w={144} sub={196} />
      <div style={{ padding: '0 16px' }}>
        <div style={{ height: 73, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bar style={{ height: 54, width: 54, borderRadius: 18, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Bar style={{ height: 10, width: 96 }} />
            <Bar style={{ height: 15, width: '52%' }} />
          </div>
          <Bar style={{ height: 22, width: 56 }} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              height: 47,
              borderTop: `1px solid ${A.BORDER}`,
              boxSizing: 'border-box',
            }}
          >
            <Bar style={{ height: 12, width: 14 }} />
            <Bar style={{ height: 32, width: 32, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Bar style={{ height: 12, width: '42%' }} />
            </div>
            <Bar style={{ height: 11, width: 42 }} />
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
          height: OVERVIEW_HERO_TOTAL_HEIGHT,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${INK_TINT_06}, rgba(15,23,42,0.02))`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE.sectionSection,
          paddingTop: SPACE.sectionSection,
          paddingBottom: 88,
        }}
      >
        <ComingUpBlock />
        <div>
          <LensRow />
          <WorldRankingsBlock />
        </div>
        {/* NOTHING BELOW THIS POINT. StatWatch, CourseOfTheWeek and
            CollegeFranchise are conditional and keep their own inline holds. */}
      </div>
    </div>
  );
};

export default TourHubOverviewSkeleton;
