import React from 'react';
import { format } from 'date-fns';
import { Flag, ChevronRight, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { RatedCourseData } from './my-ratings/MyRatingsHeroCard';

interface BreakdownsPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  missingCourses: RatedCourseData[];
  onPickCourse: (courseId: string) => void;
}

const FONT_SERIF = 'Georgia, "Times New Roman", serif';

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMMM yyyy').toUpperCase();
};

const splitRating = (rating: number) => {
  const int = Math.floor(rating);
  const dec = Math.round((rating * 10) % 10);
  return { int, dec };
};

const BreakdownsPickerSheet: React.FC<BreakdownsPickerSheetProps> = ({
  isOpen,
  onClose,
  missingCourses,
  onPickCourse,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="!bg-[#F8FAFC] border-0 p-0 max-h-[85vh] flex flex-col rounded-t-2xl"
      >
        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 6,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: 'rgba(15,23,42,0.18)',
            }}
          />
        </div>

        {/* Header */}
        <SheetHeader className="px-5 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle
                style={{
                  fontFamily: FONT_SERIF,
                  fontWeight: 900,
                  fontSize: 22,
                  color: '#0F172A',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.1,
                  textAlign: 'left',
                }}
              >
                Add breakdowns
              </SheetTitle>
              <p
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  marginTop: 6,
                  textAlign: 'left',
                }}
              >
                {missingCourses.length}{' '}
                {missingCourses.length === 1 ? 'course is' : 'courses are'}{' '}
                missing breakdown ratings. Tap one to add details.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: 0,
                cursor: 'pointer',
              }}
            >
              <X size={16} color="#475569" strokeWidth={2} />
            </button>
          </div>
        </SheetHeader>

        {/* Divider */}
        <div
          style={{ height: 1, background: '#E2E8F0', flexShrink: 0 }}
          aria-hidden
        />

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#FFFFFF' }}>
          {missingCourses.map((course) => {
            const dateIso = course.review_date ?? course.last_played_at ?? null;
            const dateText = formatDate(dateIso);
            const { int, dec } = splitRating(course.rating_value);

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onPickCourse(course.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  background: '#FFFFFF',
                  borderBottom: '1px solid #F1F5F9',
                  border: 0,
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: '#F1F5F9',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: course.thumbnail_image
                      ? `url(${course.thumbnail_image})`
                      : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!course.thumbnail_image && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        opacity: 0.5,
                      }}
                    >
                      <Flag size={18} />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONT_SERIF,
                      fontWeight: 900,
                      fontSize: 15,
                      color: '#0F172A',
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {course.name}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        color: '#0F172A',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {int}.{dec}
                    </span>
                    {dateText && (
                      <>
                        <span style={{ color: '#CBD5E1' }}> · </span>
                        <span>ADDED {dateText}</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  color="#94A3B8"
                  strokeWidth={2}
                  style={{ flexShrink: 0 }}
                />
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BreakdownsPickerSheet;
