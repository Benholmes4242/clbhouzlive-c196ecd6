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
import { Bar } from '@/components/skeletons/shellVocabulary';
import { HERO_FIGURE_LABEL, HERO_FIGURE_VALUE } from '../CourseMasthead';
import {
  MEDIA_CARD_W, MOSAIC_H, RAIL_GAP, RAIL_LABEL_STYLE, RAIL_X, REVIEW_AVATAR, REVIEW_BG,
  REVIEW_RADIUS, WRITTEN_CARD_W,
} from '../ReviewRailSlot';
import {
  HEAD_GAP, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE, SECTION_WRAP,
} from './SectionHead';
import { RAIL_BLEED } from './format';
import {
  RING_GAP, RING_ITEM_W, RING_LABEL_GAP, RING_LABEL_LINE, RING_RADIUS, RING_ROW_PAD_TOP, RING_ROW_TOP, RING_SIZE, TAB_H, TABS_TOP,
} from './WhoPlayingSection';
import {
  BEST_CARD_W, BUTTON_H, BUTTON_TOP, FACE_SIZE, FACES_TOP, PHOTO_TILE_W, TILE_NAME_LINE, TILE_RADIUS, TILE_ROW_GAP, TILE_ROW_H, TILE_ROW_TOP, TILE_TOP,
} from './PlayedTile';
import { PLAYED_KICKER, PLAYED_TITLE } from './playedParts';
import { REGION_GAP, REGION_TILE_H, REGION_TILES_NO_LEAD } from './ByRegionSection';
import { PHOTO_FIGURE_GAP } from './PhotoFigureCard';
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

/**
 * What's been played (BRIEF_WHATS_BEEN_PLAYED §5): the signed-off head, a 34px
 * chip row, 64px squircle rings at a 72px pitch with two label lines, the tile
 * head and sub line, the 186px row, faces line and 44px button. Rails need no
 * shell — the page gate holds them. Every bar sits inside its real line box.
 */
export function WhoPlayingShell() {
  const clip: React.CSSProperties = { display: 'flex', overflow: 'hidden', padding: '0 16px' };
  const line = (h: number, w: number | string, bar: number) => (
    <div style={{ height: h, display: 'flex', alignItems: 'center' }}><Bar style={{ height: bar, width: w }} /></div>
  );
  return (
    <section aria-hidden data-who-shell="" style={{ padding: '20px 0 14px' }}>
      <div style={{ padding: '0 16px' }}>
        {line(PLAYED_KICKER.lineHeight, 72, 8)}
        <div style={{ marginTop: PLAYED_TITLE.gap }}>{line(PLAYED_TITLE.lineHeight, 190, 17)}</div>
      </div>
      <div style={{ ...clip, gap: 8, marginTop: TABS_TOP }}>
        {[84, 64].map((w) => <Bar key={w} style={{ height: TAB_H, width: w, borderRadius: 13, flex: 'none' }} />)}
      </div>
      <div style={{ ...clip, gap: RING_GAP, marginTop: RING_ROW_TOP, paddingTop: RING_ROW_PAD_TOP, paddingBottom: 2 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 'none', width: RING_ITEM_W }}>
            <Bar style={{ width: RING_SIZE, height: RING_SIZE, margin: '0 4px', borderRadius: RING_RADIUS }} />
            <div style={{ marginTop: RING_LABEL_GAP }}>
              <div style={{ height: RING_LABEL_LINE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bar style={{ height: 8, width: 56 }} /></div>
              <div style={{ height: RING_LABEL_LINE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bar style={{ height: 8, width: 36 }} /></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ margin: `${TILE_TOP}px 16px 0` }}>
        <div style={{ height: TILE_NAME_LINE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Bar style={{ height: 15, width: 150 }} />
        </div>
        <div style={{ display: 'flex', overflow: 'hidden', gap: TILE_ROW_GAP, margin: `${TILE_ROW_TOP}px -16px 0`, padding: '0 16px' }}>
          <Bar style={{ flex: 'none', width: BEST_CARD_W, height: TILE_ROW_H, borderRadius: TILE_RADIUS }} />
          {[0, 1].map((i) => <Bar key={i} style={{ flex: 'none', width: PHOTO_TILE_W, height: TILE_ROW_H, borderRadius: TILE_RADIUS }} />)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: FACES_TOP, height: FACE_SIZE }}>
          <Bar style={{ height: FACE_SIZE, width: FACE_SIZE * 3, borderRadius: '34%' }} /><Bar style={{ height: 9, width: 150 }} />
        </div>
        <Bar style={{ marginTop: BUTTON_TOP, height: BUTTON_H, width: '100%', borderRadius: 14 }} />
      </div>
    </section>
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

/** Standout rounds: two scorecard-tile bars at the tile's own width. */
export function StandoutRoundsShell() {
  return (
    <HeadShell>
      <div data-standout-shell style={{ ...RAIL_CLIPPED, gap: 10 }}>
        {[0, 1].map((i) => (
          <Bar key={i} style={{ width: 'min(300px, calc(100vw - 64px))', height: 410, flex: 'none', borderRadius: 18 }} />
        ))}
      </div>
    </HeadShell>
  );
}

/** Latest from the courses: two 332x293 cards, clipped. */
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
 * Latest reviews (LATEST_REVIEWS_MAGAZINE): the two rails in their new card
 * shapes — a media card (236px mosaic block, then body lines) and a written
 * card (lines) — each under its rail label bar. Bars stand only for lines
 * the settled card can show; the cards clip, so a bar never escapes its cell.
 */
export function LatestReviewsShell() {
  return (
    <HeadShell>
      <div style={BLEED}>
        <div style={{ display: 'flex', gap: RAIL_GAP, overflow: 'hidden', padding: `0 ${RAIL_X}px` }}>
          <div
            data-review-shell-card=""
            style={{
              width: MEDIA_CARD_W, flexShrink: 0, boxSizing: 'border-box', background: REVIEW_BG,
              borderRadius: REVIEW_RADIUS, overflow: 'hidden', paddingBottom: 16,
            }}
          >
            <Bar style={{ height: MOSAIC_H, width: '100%', borderRadius: 0 }} />
            <div style={{ padding: '14px 16px 0' }}>
              <Bar style={{ height: 9, width: '46%' }} />
              <div style={{ marginTop: 10 }}><Bar style={{ height: 14, width: '78%' }} /></div>
              <div style={{ marginTop: 7 }}><Bar style={{ height: 9, width: '94%' }} /></div>
              <div style={{ marginTop: 6 }}><Bar style={{ height: 9, width: '88%' }} /></div>
              <div style={{ marginTop: 6 }}><Bar style={{ height: 9, width: '52%' }} /></div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                    <Bar style={{ height: 12, width: '60%' }} />
                    <div style={{ marginTop: 5 }}><Bar style={{ height: 6, width: '80%' }} /></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bar style={{ height: REVIEW_AVATAR, width: REVIEW_AVATAR, borderRadius: '34%' }} />
                <Bar style={{ height: 9, width: '34%' }} />
                <Bar style={{ height: 8, width: '22%', marginLeft: 'auto' }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...RAIL_LABEL_STYLE, marginTop: 24, display: 'flex', alignItems: 'center' }}><Bar style={{ height: 7, width: 96 }} /></div>
        <div style={{ display: 'flex', gap: RAIL_GAP, overflow: 'hidden', padding: `0 ${RAIL_X}px` }}>
          <div
            data-review-shell-card=""
            style={{
              width: WRITTEN_CARD_W, flexShrink: 0, boxSizing: 'border-box', background: REVIEW_BG,
              borderRadius: REVIEW_RADIUS, overflow: 'hidden', padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Bar style={{ height: 9, width: '42%' }} />
              <Bar style={{ height: 20, width: 44 }} />
            </div>
            <div style={{ marginTop: 12 }}><Bar style={{ height: 14, width: '72%' }} /></div>
            <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: '3px solid rgba(248,250,252,.24)', borderRadius: 2 }}>
              <Bar style={{ height: 10, width: '96%' }} />
              <div style={{ marginTop: 7 }}><Bar style={{ height: 10, width: '90%' }} /></div>
              <div style={{ marginTop: 7 }}><Bar style={{ height: 10, width: '58%' }} /></div>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <Bar style={{ height: 12, width: '60%' }} />
                  <div style={{ marginTop: 5 }}><Bar style={{ height: 6, width: '80%' }} /></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bar style={{ height: REVIEW_AVATAR, width: REVIEW_AVATAR, borderRadius: '34%' }} />
              <Bar style={{ height: 9, width: '34%' }} />
              <Bar style={{ height: 8, width: '14%', marginLeft: 'auto' }} />
            </div>
          </div>
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
