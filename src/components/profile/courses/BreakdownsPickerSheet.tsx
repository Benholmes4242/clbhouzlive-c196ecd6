import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDayMonthLongYearGB } from '@/i18n/format';
import { Flag, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { RatedCourseData } from './my-ratings/myRatingsTiers';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface BreakdownsPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  missingCourses: RatedCourseData[];
  onPickCourse: (courseId: string) => void;
  mode?: 'breakdowns' | 'review';
}

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDayMonthLongYearGB(d).toUpperCase();
};

const splitRating = (rating: number) => {
  const int = Math.floor(rating);
  const dec = Math.round((rating * 10) % 10);
  return { int, dec };
};

/** Band boundaries derive from the CURRENT year - never hard-coded (S2.5). */
type Band = 'thisYear' | 'lastYear' | 'earlier';
const BAND_ORDER: Band[] = ['thisYear', 'lastYear', 'earlier'];

const dateOf = (c: RatedCourseData): string | null =>
  c.review_date ?? c.last_played_at ?? null;

const yearOf = (c: RatedCourseData): number | null => {
  const iso = dateOf(c);
  if (!iso) return null;
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? y : null;
};

const bandOf = (c: RatedCourseData, thisYear: number): Band => {
  const y = yearOf(c);
  if (y === thisYear) return 'thisYear';
  if (y === thisYear - 1) return 'lastYear';
  return 'earlier';
};

const BreakdownsPickerSheet: React.FC<BreakdownsPickerSheetProps> = ({
  isOpen,
  onClose,
  missingCourses,
  onPickCourse,
  mode = 'breakdowns',
}) => {
  const { t } = useTranslation('courses');

  /** Newest played first (S2.2), then grouped into recency bands (S2.3). */
  const bands = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const sorted = [...missingCourses].sort((a, b) => {
      const da = dateOf(a) ?? '';
      const db = dateOf(b) ?? '';
      if (da === db) return a.name.localeCompare(b.name);
      return da < db ? 1 : -1;
    });
    const map = new Map<Band, RatedCourseData[]>();
    for (const c of sorted) {
      const b = bandOf(c, thisYear);
      const list = map.get(b);
      if (list) list.push(c);
      else map.set(b, [c]);
    }
    // Empty bands do not render (S2.3).
    return BAND_ORDER.filter((b) => (map.get(b)?.length ?? 0) > 0).map((b) => ({
      band: b,
      courses: map.get(b) as RatedCourseData[],
    }));
  }, [missingCourses]);

  /** Real figures only (S3.3). Rounds-per-course is not available here. */
  const rail = useMemo(() => {
    const years = missingCourses
      .map(yearOf)
      .filter((y): y is number => y != null);
    const span = years.length ? Math.max(...years) - Math.min(...years) + 1 : 0;
    return { courses: missingCourses.length, years: span };
  }, [missingCourses]);

  const bandLabel = (b: Band): string =>
    b === 'thisYear'
      ? t('toReview.bandThisYear', 'THIS YEAR')
      : b === 'lastYear'
        ? t('toReview.bandLastYear', 'LAST YEAR')
        : t('toReview.bandEarlier', 'EARLIER');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="!bg-[#15171F] border-0 p-0 flex flex-col rounded-t-2xl"
        style={{ height: 'auto', maxHeight: '85dvh' }}
      >

        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 8,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
            }}
          />
        </div>

        {/* Header - caps masthead + stat rail (S3) */}
        <SheetHeader className="px-4 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.05,
                  color: A.INK,
                  textAlign: 'left',
                }}
              >
                {mode === 'review'
                  ? t('toReview.title', 'Courses to review')
                  : t('toReview.titleBreakdowns', 'Add breakdowns')}
              </SheetTitle>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 12 }}>
                {[
                  { figure: rail.courses, label: t('toReview.railCourses', 'COURSES') },
                  { figure: rail.years, label: t('toReview.railYears', 'YEARS') },
                ].map((pair) => (
                  <div key={pair.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 13.5,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: A.INK,
                      }}
                    >
                      {pair.figure}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        lineHeight: 1,
                        color: A.DIM,
                      }}
                    >
                      {pair.label}
                    </span>
                  </div>
                ))}
              </div>

              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  color: A.MUTE,
                  marginTop: 10,
                  textAlign: 'left',
                }}
              >
                {mode === 'review'
                  ? t('toReview.subline', 'Played but not rated - newest first.')
                  : t('toReview.sublineBreakdowns', 'Missing breakdown ratings - newest first.')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('toReview.close', 'Close')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: 0,
                cursor: 'pointer',
              }}
            >
              <X size={16} color={A.MUTE} strokeWidth={2} />
            </button>
          </div>
        </SheetHeader>

        {/* Divider */}
        <div
          style={{ height: 1, background: A.BORDER, flexShrink: 0 }}
          aria-hidden
        />

        {/* List - the safe-area inset rides on the SCROLLING content (S1.3) */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        >
          {bands.map(({ band, courses }) => (
            <div key={band}>
              {/* Sticky band header with its count (S2.3) */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  background: A.CANVAS,
                  borderBottom: `1px solid ${A.BORDER}`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: A.DIM,
                  }}
                >
                  {bandLabel(band)}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: A.DIM,
                  }}
                >
                  {courses.length}
                </span>
              </div>

              {courses.map((course) => {
                const dateText = formatDate(dateOf(course));
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
                      gap: 10,
                      padding: '10px 16px',
                      minHeight: 60,
                      background: 'transparent',
                      border: 0,
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: A.BORDER,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        position: 'relative',
                        width: 40,
                        height: 40,
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
                          <Flag size={14} />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONT_SANS,
                          fontWeight: 700,
                          fontSize: 13.5,
                          color: A.INK,
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
                          fontFamily: FONT_SANS,
                          marginTop: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          color: A.MUTE,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {mode !== 'review' && (
                          <span
                            style={{
                              color: A.INK,
                              fontVariantNumeric: 'tabular-nums lining-nums',
                            }}
                          >
                            {int}.{dec}
                          </span>
                        )}
                        {dateText && (
                          <>
                            {mode !== 'review' && <span style={{ color: A.BORDER }}> · </span>}
                            <span>{mode === 'review' ? 'PLAYED ' : 'ADDED '}{dateText}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* RATE pill - names the one action (S4.3); row stays tappable */}
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '5px 10px',
                        borderRadius: 999,
                        border: `1px solid ${A.BORDER}`,
                        fontFamily: FONT_SANS,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color: A.INK,
                        lineHeight: 1,
                      }}
                    >
                      {t('toReview.rate', 'RATE')}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BreakdownsPickerSheet;
