/**
 * BRIEF_YOU_TAB_REBUILD §3.2 — "ALL N ROUNDS", the destination.
 *
 * The You tab shows four rounds; this is every one of them, same row, same
 * canonical scorecard sheet on tap (RoundDetailSheet, untouched). No new query:
 * useMyRoundsAtCourse with a higher cap.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { formatMonthDayYearShort, formatNumber } from '@/i18n/format';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { useMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CourseRoundsPage: React.FC = () => {
  const { t } = useTranslation('courses');
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: rounds } = useMyRoundsAtCourse(courseId, { limit: 200 });
  const [openRoundId, setOpenRoundId] = React.useState<string | null>(null);

  const list = rounds ?? [];
  const grosses = list.map((r) => r.grossScore).filter((g): g is number => g != null);
  const bestGross = grosses.length > 0 ? Math.min(...grosses) : null;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: A.CANVAS,
        fontFamily: SANS,
        paddingTop: CHROME_CLEARANCE,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      <div style={{ padding: '0 20px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back', { defaultValue: 'Back' })}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            color: A.MUTE,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
          {t('courseDetail.youTab.allRoundsTitle')}
        </h1>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: A.MUTE, ...FIGS }}>
          {formatNumber(list.length)}
        </span>
      </div>

      <div style={{ padding: '0 20px' }}>
        {list.map((round) => {
          const toPar =
            round.grossScore != null && round.coursePar != null ? round.grossScore - round.coursePar : null;
          const parts = toParParts(toPar, 0);
          const isBest = bestGross != null && list.length > 1 && round.grossScore === bestGross;
          return (
            <button
              key={round.whsScoreId}
              type="button"
              onClick={() => {
                analyticsEvents.track('course_you_round_opened', {
                  course_id: courseId,
                  whs_score_id: round.whsScoreId,
                  source: 'all_rounds',
                });
                setOpenRoundId(round.whsScoreId);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderBottom: `1px solid ${A.HAIRLINE}`,
                padding: '11px 0',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: A.INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatMonthDayYearShort(new Date(round.playDate))}
              </span>
              {isBest ? (
                <span style={{ ...ABOUT_KICKER, color: A.AMBER_DEEP, flexShrink: 0 }}>
                  {t('courseDetail.youTab.bestKicker')}
                </span>
              ) : null}
              <span style={{ fontSize: 16, fontWeight: 700, color: A.INK, width: 34, textAlign: 'right', ...FIGS }}>
                {round.grossScore ?? '\u2014'}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  width: 30,
                  textAlign: 'right',
                  color: parts?.tone ?? A.MUTE,
                  ...FIGS,
                }}
              >
                {parts?.text ?? '\u2014'}
              </span>
            </button>
          );
        })}
      </div>

      <RoundDetailSheet
        open={openRoundId != null}
        onClose={() => setOpenRoundId(null)}
        scoreId={openRoundId}
        profileUserId={user?.id ?? null}
      />
    </div>
  );
};

export default CourseRoundsPage;
