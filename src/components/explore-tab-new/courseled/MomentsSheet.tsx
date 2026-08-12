import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { MomentTile } from './MomentTile';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { A, KICKER, SANS } from './tokens';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * MOMENTS SHEET — the full month of member media, GROUPED BY COURSE
 * (BRIEF_MOMENTS_SHEET_GROUPED). Discover is course-led everywhere else; this
 * sheet used to be the one flat media wall, restating the same course name on
 * every tile of a cluster. Now the name appears ONCE as a group header, the
 * tiles carry no label, and each course's isCourseLead moment runs tall — size
 * means something rather than tracking a position in a loop.
 *
 * STILL UNCAPPED: the sheet's promise is the complete month. A course with
 * twenty moments shows all twenty — no "+n more", no truncation, no expander.
 *
 * Z-ORDER: the shared fullscreen viewer sits at FS_OVERLAY_Z (200). A default
 * BottomSheet base (1400) would paint OVER it, so this sheet is deliberately
 * based below the viewer.
 */

/** Below FS_OVERLAY_Z (200) so the read-only viewer opens ON TOP of the sheet. */
const SHEET_Z_UNDER_VIEWER = 150;

/* ---- Group geometry. The right column ALWAYS holds exactly two tiles, so
   81 + 6 + 81 = 168 matches the lead tile's height exactly: no ragged space. */
const GAP = 6;
const LEAD_H = 168;
const HALF_H = 81;
/** n = 1: one wide tile. Never a lonely tall tile with empty space beside it. */
const SOLO_H = 132;
const RADIUS = 12;
const COLS = '1.35fr 1fr';
/**
 * AUTOPLAY FLOOR. An 81px tile is ~a quarter of a phone's width tall: at that
 * size a moving clip reads as flicker in the corner of the eye, not as content,
 * and it competes with the 168px lead tile beside it for the same glance. Those
 * tiles keep their poster and play glyph; everything 100px and up plays. The
 * square thirds (~117px on a 390px screen) clear the floor.
 */
const MIN_AUTOPLAY_H = 100;

interface CourseGroup {
  courseId: string;
  courseName: string | null;
  /** The course's isCourseLead moment (or its first, if none is flagged). */
  lead: Moment;
  /** Everything else, in the incoming ranked order. */
  rest: Moment[];
  /** lead + rest — what the header counts. */
  total: number;
}

/**
 * Group by courseId in FIRST-APPEARANCE order. The incoming array is already
 * ranked, so first appearance preserves that ranking exactly and computes
 * nothing new — no re-sort by count, name or recency.
 */
function groupByCourse(moments: Moment[]): CourseGroup[] {
  const order: string[] = [];
  const byCourse = new Map<string, Moment[]>();
  for (const m of moments) {
    const bucket = byCourse.get(m.courseId);
    if (bucket) bucket.push(m);
    else {
      byCourse.set(m.courseId, [m]);
      order.push(m.courseId);
    }
  }
  return order.map((courseId) => {
    const list = byCourse.get(courseId)!;
    // Select the lead EXPLICITLY rather than trusting array position. It does
    // coincide with list[0] today (the hook flags the first tile it picks per
    // course, walking the ranked list), but a ranking change must not silently
    // promote the wrong tile. No flag at all -> the first tile leads; a group
    // is never rendered without a lead.
    const leadIndex = Math.max(0, list.findIndex((m) => m.isCourseLead));
    const lead = list[leadIndex];
    return {
      courseId,
      courseName: lead.courseName ?? list.find((m) => m.courseName)?.courseName ?? null,
      lead,
      rest: list.filter((_, i) => i !== leadIndex),
      total: list.length,
    };
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  moments: Moment[];
  onTilePress: (m: Moment) => void;
}

export function MomentsSheet({ open, onClose, moments, onTilePress }: Props) {
  const { t } = useTranslation('courses');
  const groups = useMemo(() => groupByCourse(moments), [moments]);
  const courseCount = groups.length;

  /** Unlabelled tile: the group header carries the course name. */
  const tile = (m: Moment, style: React.CSSProperties, initialsSize: number) => (
    <MomentTile
      key={m.key}
      moment={m}
      onPress={onTilePress}
      radius={RADIUS}
      initialsSize={initialsSize}
      labelSize={9}
      labelInset={6}
      scrimStop="50%"
      labelled={false}
      autoplayGroup="moments-sheet"
      // 81px tiles hold their poster — see MIN_AUTOPLAY_H.
      autoplay={typeof style.height !== 'number' || style.height >= MIN_AUTOPLAY_H}
      style={style}
    />
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-moments-title"
      variant="light"
      surfaceColor={A.CANVAS}
      zIndexBase={SHEET_Z_UNDER_VIEWER}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ ...KICKER, color: A.DIM, marginBottom: 5 }}>
          {t('discover.momentsOverline', {
            defaultValue: '{{count}} courses',
            count: courseCount,
          })}
        </div>
        <div
          id="courseled-moments-title"
          style={{
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {t('discover.momentsOfTheMonth', 'Moments of the month')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {groups.map((g, gi) => {
          const overflow = g.rest.slice(2);
          return (
            <div
              key={g.courseId}
              // 20px between one group's last tile and the next header; the
              // final group leans on the existing tail spacer only.
              style={{ marginBottom: gi === groups.length - 1 ? 0 : 20 }}
            >
              {/* GROUP HEADER — a bare row on A.CANVAS. No card, no border, no fill. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: A.INK,
                    letterSpacing: '-0.01em',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.courseName ?? t('discover.unknownCourse', 'Course')}
                </div>
                {/* The count is load-bearing: it is what makes an unlabelled
                    tile grid honest about how much is in each group. */}
                <div
                  style={{
                    ...KICKER,
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: A.DIM,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    flexShrink: 0,
                  }}
                >
                  {t('discover.momentsGroupCount', {
                    defaultValue: '{{count}} moments',
                    count: g.total,
                  })}
                </div>
              </div>

              {g.total === 1 ? (
                /* n = 1 — one full-width tile. */
                tile(g.lead, { height: SOLO_H, width: '100%' }, 26)
              ) : g.total === 2 ? (
                /* n = 2 — two-up, BOTH full height, the lead the wider one. */
                <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: GAP }}>
                  {tile(g.lead, { height: LEAD_H }, 30)}
                  {tile(g.rest[0], { height: LEAD_H }, 22)}
                </div>
              ) : (
                /* n >= 3 — lead 168 left, two tiles at 81 right: exact fit. */
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: GAP }}>
                    {tile(g.lead, { height: LEAD_H }, 30)}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                      {tile(g.rest[0], { height: HALF_H }, 16)}
                      {tile(g.rest[1], { height: HALF_H }, 16)}
                    </div>
                  </div>
                  {/* n > 3 — the remainder continues beneath as square thirds. */}
                  {overflow.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: GAP,
                        marginTop: GAP,
                      }}
                    >
                      {overflow.map((m) => tile(m, { aspectRatio: '1 / 1' }, 18))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default MomentsSheet;
