/**
 * CourseRecordBook — the Champions content promoted onto the Course tab.
 *
 * Renders the rank-1 holder for the headline all-time boards as edge-to-edge
 * alternating bands (no cards, per the Champions legibility pass), plus a
 * "See all boards" affordance that opens the full drilldown in a 75dvh sheet.
 *
 * Data comes from the existing useCourseLegends RPC via useCourseRecordSummary
 * — no new query is introduced.
 */
import React, { useState } from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { legendCategoryLabel, formatLegendValueCompact } from '@/lib/gam/visuals';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { AMBER, INK, INK_MUTE, HAIRLINE_INK_7 } from '@/features/courses/_shared/tokens';
import { useCourseRecordSummary } from './useCourseRecordSummary';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface Props {
  courseId: string;
  courseName: string;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseType?: string | null;
  /** Category to scroll to / highlight, forwarded from the ?cat= deep link. */
  initialCategory?: string | null;
}

export const CourseRecordBook: React.FC<Props> = ({
  courseId,
  courseName,
  courseRegion = null,
  courseCountry = null,
  courseType = null,
  initialCategory = null,
}) => {
  const { user } = useSupabaseSession();
  const { isLoading, previewRows, unclaimedCount, hasAnyHolder } =
    useCourseRecordSummary(courseId, user?.id ?? null);
  const [open, setOpen] = useState(Boolean(initialCategory));

  if (isLoading) {
    return (
      <section style={{ padding: '4px 0 0' }}>
        <SectionHeader role="section" kicker="THE RECORD BOOK" paddingX={16} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
                background: i % 2 === 0 ? '#FFFFFF' : 'rgba(15,23,42,0.02)',
                borderTop: `0.5px solid ${HAIRLINE_INK_7}`,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '4px 0 0' }}>
      <SectionHeader role="section" kicker="THE RECORD BOOK" paddingX={16} />

      {hasAnyHolder ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {previewRows.map(({ category, row }, i) => (
            <button
              key={category}
              type="button"
              onClick={() => setOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                border: 0,
                cursor: 'pointer',
                padding: '12px 16px',
                background: i % 2 === 0 ? '#FFFFFF' : 'rgba(15,23,42,0.02)',
                borderTop: `0.5px solid ${HAIRLINE_INK_7}`,
              }}
            >
              <SquircleAvatar
                src={row.user_photo_url}
                alt={row.user_display_name ?? 'Golfer'}
                userId={row.user_id}
                size={34}
                thinRing
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: INK_MUTE,
                    textTransform: 'uppercase',
                  }}
                >
                  {legendCategoryLabel[category]}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {i === 0 && <Crown size={13} color={AMBER} strokeWidth={2.4} />}
                  {row.user_display_name ?? 'Golfer'}
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatLegendValueCompact(category, row.value)}
              </div>
              <ChevronRight size={16} color={INK_MUTE} />
            </button>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, padding: '0 16px', fontSize: 13, color: INK_MUTE, lineHeight: 1.5 }}>
          No boards claimed at {courseName} yet. Every record here is up for grabs.
        </p>
      )}

      <div style={{ padding: '12px 16px 0' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '11px 0',
            borderRadius: 14,
            background: 'rgba(247,147,30,0.06)',
            border: '1.5px solid rgba(247,147,30,0.2)',
            fontSize: 13,
            fontWeight: 700,
            color: AMBER,
            cursor: 'pointer',
          }}
        >
          {unclaimedCount > 0
            ? `See all boards · ${unclaimedCount} unclaimed`
            : 'See all boards'}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-2xl overflow-hidden"
          style={{ height: '75dvh', maxHeight: '75dvh' }}
        >
          <div className="hcp-light h-full overflow-y-auto overscroll-contain">
            <CourseLegendsDrilldown
              selection={{
                courseId,
                courseName,
                courseRegion,
                courseCountry,
                courseType,
              }}
              hideHeader
              theme="light"
            />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default CourseRecordBook;
