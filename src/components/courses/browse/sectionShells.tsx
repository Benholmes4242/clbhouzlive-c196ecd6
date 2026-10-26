/**
 * COURSES TAB SECTION SHELLS — BRIEF_COURSES_SKELETONS Phase 2.
 *
 * Each shell is the loading state of ONE real section and reads that
 * section's own exported geometry constants; nothing here is a chosen number
 * except bar WIDTHS standing in for text (text width is content, not geometry).
 * Bars come from the shared shell vocabulary (Skeleton primitive,
 * clb-shimmer-dark). Rails show what is on screen, not what the rail can hold.
 *
 * HEAD: every shell wraps in the real SECTION_WRAP and reserves the real
 * SectionHead line boxes (kicker HEAD_KICKER_SIZE at lineHeight 1, title
 * HEAD_TITLE_SIZE x HEAD_TITLE_LINE_HEIGHT after HEAD_TITLE_GAP), then HEAD_GAP.
 * EyebrowBar is NOT used inside it: its 20 + 19 rows are Discover's eyebrow,
 * not this head, and using it would make the shell taller than the head.
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HAIRLINE_INK_8 } from '@/features/courses/_shared/tokens';
import { Bar } from '@/components/skeletons/shellVocabulary';
import { HERO_FIGURE_LABEL, HERO_FIGURE_VALUE } from '../CourseMasthead';
import {
  CARD_W as REVIEW_W, REVIEW_FOOT, REVIEW_GAP, REVIEW_NAME, REVIEW_PAD, REVIEW_QUOTE,
  REVIEW_RADIUS, REVIEW_RAIL_X, REVIEW_RATING_SIZE,
} from '../ReviewRailSlot';
import {
  HEAD_GAP, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE, SECTION_WRAP,
} from './SectionHead';
import { RAIL_BLEED } from './format';
import {
  WHO_CARD_RADIUS, WHO_CARD_W, WHO_FACE_H, WHO_FOOTER_PAD, WHO_PHOTO_H, WHO_RAIL_GAP,
} from './WhoPlayingSection';
import { REGION_GAP, REGION_TILE_H, REGION_TILES_NO_LEAD } from './ByRegionSection';
import { PHOTO_FIGURE_GAP, PHOTO_FIGURE_H, PHOTO_FIGURE_W } from './PhotoFigureCard';
import { TOUGH_COUNT, TOUGH_GAP, TOUGH_TILE_H } from './HardestSection';
import { LATEST_HOLE_W, LATEST_HOLE_H } from './LatestHolesSection';
import { LATEST_COURSE_W, LATEST_COURSE_H } from './LatestCoursesSection';

const RAIL_CLIPPED: React.CSSProperties = { ...RAIL_BLEED, overflow: 'hidden' };
const BLEED: React.CSSProperties = { marginLeft: -16, marginRight: -16 };

/** The real SectionHead's line boxes, inside the real SECTION_WRAP. */
function HeadShell({ title = true, children }: { title?: boolean; children: React.ReactNode }) {
  return (
    <section aria-hidden style={SECTION_WRAP}>
      <div style={{ height: HEAD_KICKER_SIZE, display: 'flex', alignItems: 'center' }}>
        <Bar style={{ height: HEAD_KICKER_SIZE - 2, width: 96 }} />
      </div>
      {title ? (
        <div
          style={{
            marginTop: HEAD_TITLE_GAP,
            height: HEAD_TITLE_SIZE * HEAD_TITLE_LINE_HEIGHT,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Bar style={{ height: HEAD_TITLE_SIZE - 3, width: 180 }} />
        </div>
      ) : null}
      <div style={{ marginTop: HEAD_GAP }}>{children}</div>
    </section>
  );
}

/** Recently played: two cards and a clipped third. */
export function WhoPlayingShell() {
  const footH = WHO_FOOTER_PAD.top + WHO_FACE_H + WHO_FOOTER_PAD.bottom;
  return (
    <HeadShell>
      <div style={{ ...RAIL_CLIPPED, gap: WHO_RAIL_GAP }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: WHO_CARD_W, flex: 'none', overflow: 'hidden',
              border: `1px solid ${A.BORDER}`, borderRadius: WHO_CARD_RADIUS,
            }}
          >
            {/* Photo is clipped square by the card's own overflow. */}
            <Bar style={{ height: WHO_PHOTO_H, width: '100%', borderRadius: 0 }} />
            <div
              style={{
                height: footH, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8,
                padding: `${WHO_FOOTER_PAD.top}px ${WHO_FOOTER_PAD.x}px ${WHO_FOOTER_PAD.bottom}px`,
              }}
            >
              <Bar style={{ height: WHO_FACE_H, width: WHO_FACE_H - 1, borderRadius: '34%' }} />
              <Bar style={{ height: 9, width: 140 }} />
            </div>
          </div>
        ))}
      </div>
    </HeadShell>
  );
}

/**
 * By region: the NO-LEAD layout — four tiles plus a spanning fifth, all at
 * REGION_TILE_H. The lead layout (168 + two rows) is 46px taller, and whether
 * a lead exists is unknown until the home region resolves, so drawing it would
 * break "never larger than the smallest settled state".
 */
export function ByRegionShell() {
  return (
    <HeadShell>
      <div style={{ ...BLEED, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: REGION_GAP }}>
        {Array.from({ length: REGION_TILES_NO_LEAD }, (_, i) => (
          <Bar
            key={i}
            style={{
              height: REGION_TILE_H, borderRadius: 0,
              gridColumn: i === REGION_TILES_NO_LEAD - 1 ? 'span 2' : undefined,
            }}
          />
        ))}
      </div>
    </HeadShell>
  );
}

/** Most played and Highest rated: PhotoFigureCards, the real count per rail. */
export function PhotoRailShell({ count }: { count: number }) {
  return (
    <HeadShell>
      <div style={{ ...RAIL_CLIPPED, gap: PHOTO_FIGURE_GAP }}>
        {Array.from({ length: count }, (_, i) => (
          <Bar key={i} style={{ width: PHOTO_FIGURE_W, height: PHOTO_FIGURE_H, flex: 'none', borderRadius: 0 }} />
        ))}
      </div>
    </HeadShell>
  );
}

/** Latest from the courses: two 300x230 cards, clipped. */
export function LatestCourseSkeletonCard() {
  return <Bar className="latest-course-skeleton-card" style={{ width: LATEST_COURSE_W, height: LATEST_COURSE_H, borderRadius: 0, flex: 'none' }} />;
}

export function LatestHoleSkeletonCard() {
  return <Bar className="latest-hole-skeleton-card" style={{ width: LATEST_HOLE_W, height: LATEST_HOLE_H, borderRadius: 0, flex: 'none' }} />;
}

export function LatestCoursesShell() {
  return (
    <HeadShell>
      <div style={{ ...RAIL_CLIPPED, gap: PHOTO_FIGURE_GAP }}>
        {[0, 1].map(i => <LatestCourseSkeletonCard key={i} />)}
      </div>
    </HeadShell>
  );
}

/** Tough tracks: the 2x2 grid of square tiles. */
export function LatestHolesShell() {
  return (
    <HeadShell>
      <div style={{ ...RAIL_CLIPPED, gap: PHOTO_FIGURE_GAP }}>
        {[0, 1].map(i => <LatestHoleSkeletonCard key={i} />)}
      </div>
    </HeadShell>
  );
}

export function HardestShell() {
  return (
    <HeadShell>
      <div style={{ ...BLEED, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOUGH_GAP }}>
        {Array.from({ length: TOUGH_COUNT }, (_, i) => (
          <Bar key={i} style={{ height: TOUGH_TILE_H, borderRadius: 0 }} />
        ))}
      </div>
    </HeadShell>
  );
}

/**
 * Latest reviews: one panel and a clipped second. Each panel draws its
 * SMALLEST settled content — one name line and one quote line — so it can
 * only grow when the 2- and 3-line clamps fill.
 */
export function LatestReviewsShell() {
  const nameH = REVIEW_NAME.size * REVIEW_NAME.lineHeight;
  const quoteH = REVIEW_QUOTE.size * REVIEW_QUOTE.lineHeight;
  return (
    <HeadShell>
      <div style={BLEED}>
        <div style={{ display: 'flex', gap: REVIEW_GAP, overflow: 'hidden', padding: `0 ${REVIEW_RAIL_X}px` }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: REVIEW_W, flexShrink: 0, boxSizing: 'border-box',
                border: `1px solid ${HAIRLINE_INK_8}`, borderRadius: REVIEW_RADIUS, padding: REVIEW_PAD,
              }}
            >
              <Bar style={{ height: REVIEW_RATING_SIZE, width: 54 }} />
              <div style={{ marginTop: REVIEW_NAME.marginTop, height: nameH, display: 'flex', alignItems: 'center' }}>
                <Bar style={{ height: REVIEW_NAME.size - 3, width: '70%' }} />
              </div>
              <div style={{ marginTop: REVIEW_QUOTE.marginTop, height: quoteH, display: 'flex', alignItems: 'center' }}>
                <Bar style={{ height: REVIEW_QUOTE.size - 3, width: '92%' }} />
              </div>
              <div style={{ marginTop: REVIEW_FOOT.marginTop, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bar style={{ height: REVIEW_FOOT.avatar, width: REVIEW_FOOT.avatar, borderRadius: '34%' }} />
                <Bar style={{ height: 9, width: 80 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </HeadShell>
  );
}

/**
 * Figures row (CoursesBrowsePage): four cells. Each line box is the REAL
 * HERO_FIGURE_LABEL / HERO_FIGURE_VALUE style holding a non-breaking space, so
 * the line heights are the type's own, not restated. Only the head lives
 * outside (the page's real SectionHead stays rendered).
 */
export function FiguresRowShell() {
  return (
    <div aria-hidden style={{ display: 'flex', marginTop: HEAD_GAP }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ ...HERO_FIGURE_LABEL, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Bar style={{ height: (HERO_FIGURE_LABEL.fontSize as number) - 2, width: 44 }} />{'\u00A0'}
          </span>
          <span style={{ ...HERO_FIGURE_VALUE, display: 'flex', alignItems: 'center' }}>
            <Bar style={{ height: (HERO_FIGURE_VALUE.fontSize as number) - 3, width: 40 }} />{'\u00A0'}
          </span>
        </div>
      ))}
    </div>
  );
}
