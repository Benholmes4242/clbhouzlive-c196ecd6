/**
 * CourseStatsSheet - explains the three figures on the course band.
 *
 * Uses the app's canonical `BottomSheet` primitive (src/components/ui/
 * BottomSheet.tsx), dark variant. No new sheet primitive is introduced.
 *
 * Data comes from `useCourseStatsDetail`, which is enabled ONLY while this
 * sheet is open - one RPC call per open, none on feed render.
 *
 * Sections appear only when earned: a null field means the block is absent,
 * never a dash and never a zero.
 *
 * Analytics callsites:
 *  - course_sheet_opened      { course_id, rounds_tracked, thin }
 *  - course_sheet_view_course { course_id }
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatRatingValue } from '@/utils/formatters';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { FIGS, TITLE } from '@/lib/tokens/type';

const THIN_ROUNDS = 10;

const T100 = '#F8FAFC';
const T70 = 'rgba(248,250,252,0.72)';
const T50 = 'rgba(248,250,252,0.52)';
const T40 = 'rgba(248,250,252,0.42)';
const RED = '#EF4444';
const AMBER = '#F7931E';
const LINE = 'rgba(255,255,255,0.10)';
// App charcoal surface (same value the dark handicap hero uses via --hcp-bg-0).
const CHARCOAL = '#15171F';

const kickerStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: AMBER,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T40,
  marginTop: 4,
};

const Section: React.FC<{
  figure?: string;
  figureColor?: string;
  figureSize?: number;
  label: string;
  headline?: string;
  body?: string;
  note?: string;
  children?: React.ReactNode;
}> = ({ figure, figureColor, figureSize = 30, label, headline, body, note, children }) => (
  <section style={{ padding: '14px 18px', borderTop: `1px solid ${LINE}` }}>
    {figure ? (
      <div
        style={{
          ...FIGS,
          fontSize: figureSize,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: figureColor ?? T100,
        }}
      >
        {figure}
      </div>
    ) : null}
    <div style={sectionLabel}>{label}</div>
    {headline ? (
      <div style={{ fontSize: 14.5, fontWeight: 700, color: T100, marginTop: 8, letterSpacing: '-0.01em' }}>
        {headline}
      </div>
    ) : null}
    {body ? (
      <div style={{ fontSize: 13, color: T70, marginTop: 4, lineHeight: 1.45 }}>{body}</div>
    ) : null}
    {note ? (
      <div
        style={{
          marginTop: 10,
          padding: '8px 10px',
          background: 'rgba(247,147,30,0.10)',
          borderLeft: `2px solid ${AMBER}`,
          fontSize: 12.5,
          color: T70,
          lineHeight: 1.45,
        }}
      >
        {note}
      </div>
    ) : null}
    {children}
  </section>
);

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string | null;
  courseName?: string | null;
  courseLocation?: string | null;
  courseRating?: number | null;
}

export const CourseStatsSheet: React.FC<Props> = ({
  open,
  onClose,
  courseId,
  courseName,
  courseLocation,
  courseRating,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { data } = useCourseStatsDetail(courseId, open);
  const firedRef = useRef<string | null>(null);

  const roundsTracked = data?.rounds_tracked ?? 0;
  const thin = roundsTracked > 0 && roundsTracked < THIN_ROUNDS;

  useEffect(() => {
    if (!open || !data || !courseId) return;
    if (firedRef.current === courseId) return;
    firedRef.current = courseId;
    analyticsEvents.track('course_sheet_opened', {
      course_id: courseId,
      rounds_tracked: roundsTracked,
      thin,
    });
  }, [open, data, courseId, roundsTracked, thin]);

  useEffect(() => {
    if (!open) firedRef.current = null;
  }, [open]);

  const handleViewCourse = () => {
    if (!courseId) return;
    analyticsEvents.track('course_sheet_view_course', { course_id: courseId });
    onClose();
    navigate(`/courses/${courseId}`);
  };

  const bestAt = data?.your_best_at
    ? new Date(data.your_best_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <BottomSheet open={open} onClose={onClose} variant="dark" surfaceColor={CHARCOAL} maxHeight="90dvh">
      <div style={{ overflowY: 'auto', maxHeight: 'calc(90dvh - 40px)' }}>
        {/* Header */}
        <div style={{ padding: '4px 18px 14px' }}>
          <div style={kickerStyle}>{t('feed.courseSheet.kicker')}</div>
          <h2
            style={{
              ...TITLE,
              color: T100,
              marginTop: 6,
            }}
          >
            {courseName}
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 6,
            }}
          >
            {courseLocation ? (
              <span style={{ fontSize: 12.5, color: T50 }}>{courseLocation}</span>
            ) : null}
            {courseRating != null ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <img
                  src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 13, height: 13, objectFit: 'contain' }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    ...FIGS,
                    color: T70,
                  }}
                >
                  {formatRatingValue(courseRating)}
                </span>
                <span style={{ fontSize: 12.5, color: T50 }}>
                  {t('feed.courseSheet.memberRating')}
                </span>
              </span>
            ) : null}
          </div>
          {data?.top100_rank != null ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 10,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.12)',
                border: `1px solid rgba(247,147,30,0.28)`,
              }}
            >
              <Star size={11} color={AMBER} fill={AMBER} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: AMBER }}>
                {`#${data.top100_rank}${data.top100_list ? ` \u00b7 ${data.top100_list}` : ''}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Plays on avg */}
        {data?.avg_over_par != null ? (
          <Section
            figure={`${data.avg_over_par > 0 ? '+' : ''}${data.avg_over_par.toFixed(1)}`}
            figureColor={RED}
            label={t('feed.courseSheet.playsOnAvgLabel')}
            headline={t('feed.courseSheet.playsOnAvgHeadline', {
              avg: data.avg_over_par.toFixed(1),
            })}
            body={
              data.harder_than_pct != null
                ? t('feed.courseSheet.playsOnAvgBody', { pct: data.harder_than_pct })
                : undefined
            }
            note={thin ? t('feed.courseSheet.thinNote', { count: roundsTracked }) : undefined}
          />
        ) : null}

        {/* Rounds tracked */}
        {roundsTracked > 0 ? (
          <Section
            figure={String(roundsTracked)}
            label={t('feed.courseSheet.roundsLabel', { count: roundsTracked })}
            headline={t('feed.courseSheet.roundsHeadline', { count: roundsTracked })}
            body={
              (data?.circle_played ?? 0) > 0
                ? t('feed.courseSheet.circlePlayed', { count: data?.circle_played ?? 0 })
                : t('feed.courseSheet.circleEmpty')
            }
            note={thin ? t('feed.courseSheet.roundsThinNote') : undefined}
          />
        ) : null}

        {/* Your best */}
        <Section
          figure={data?.your_best != null ? String(data.your_best) : undefined}
          figureColor={AMBER}
          label={t('feed.courseSheet.yourBestLabel')}
          headline={
            data?.your_best != null
              ? t('feed.courseSheet.yourBestHeadline', { score: data.your_best })
              : undefined
          }
          body={
            data?.your_best != null
              ? t('feed.courseSheet.yourBestBody', {
                  date: bestAt ?? '',
                  count: data.your_rounds ?? 0,
                })
              : t('feed.courseSheet.yourBestEmpty')
          }
        />

        {/* Hardest hole */}
        {data?.hardest_hole_no != null ? (
          <section style={{ padding: '14px 18px', borderTop: `1px solid ${LINE}` }}>
            <div style={sectionLabel}>{t('feed.courseSheet.hardestHoleLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <span
                style={{
                  ...FIGS,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  color: T100,
                }}
              >
                {data.hardest_hole_no}
              </span>
              <span style={{ fontSize: 13, color: T70 }}>
                {t('feed.courseSheet.hardestHoleMeta', { par: data.hardest_hole_par ?? 0 })}{' '}
                <span style={{ color: RED, ...FIGS, fontWeight: 700 }}>
                  {data.hardest_hole_plays != null ? data.hardest_hole_plays.toFixed(2) : ''}
                </span>
              </span>
            </div>
          </section>
        ) : null}

        {/* Action */}
        <div style={{ padding: '16px 18px 8px', borderTop: `1px solid ${LINE}` }}>
          <button
            type="button"
            onClick={handleViewCourse}
            className="active:opacity-80"
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: 12,
              border: 'none',
              background: AMBER,
              color: '#0F172A',
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              cursor: 'pointer',
            }}
          >
            {t('feed.courseSheet.viewCourse')}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: T40, marginTop: 10 }}>
            {t('feed.courseSheet.footnote')}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default CourseStatsSheet;
