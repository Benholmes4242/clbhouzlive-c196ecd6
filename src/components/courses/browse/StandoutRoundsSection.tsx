import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { RoundCard } from '@/features/explore-magazine/watch/RoundCard';
import '@/features/explore-magazine/watch/lately-tile.css';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { StandoutRoundsShell } from './sectionShells';
import { useCoursesStandoutRounds, type CoursesStandoutRound } from './useCoursesStandoutRounds';
import { standoutLine, standoutPlace, standoutStamp, type StandoutT } from './standoutRoundsRules';
import './standout-rounds.css';

/**
 * COURSES_PAGE_STANDOUT_ROUNDS — replaces The regulars. The function owns
 * selection and order; this section renders its rows on the Lately here
 * RoundCard with a photo header. Taps open RoundDetailSheet in place (as
 * CourseLatelySection does); the who row opens the profile. Signed out,
 * errored or fewer than two rows: nothing, and ready at once.
 */
export const STANDOUT_MIN = 2;

export function StandoutPhotoHeader({ row, t }: { row: CoursesStandoutRound; t?: StandoutT }) {
  const place = standoutPlace(row);
  return (
    <div className="standout-photo" data-standout-photo>
      <CourseImageFallback flatWhenEmpty courseId={row.course_id} courseName={row.course_name} imageUrl={row.course_image} style={{ height: '100%' }}>
        <div className="standout-scrim" />
        <span className="standout-stamp" data-standout-stamp>{standoutStamp(row, t)}</span>
        <div className="standout-course">
          <div className="standout-course-name" data-standout-course>{row.course_name}</div>
          {place ? <span className="standout-course-place" data-standout-place>{place}</span> : null}
        </div>
      </CourseImageFallback>
    </div>
  );
}

export function StandoutRoundsSection() {
  const { t, i18n } = useTranslation('courses');
  const locale = i18n?.language || 'en';
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id;
  const q = useCoursesStandoutRounds(userId);
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const shapes = useRoundHoleShapes(useMemo(() => rows.map((r) => r.whs_score_id), [rows]));
  const opener = useScorecardOpener();

  const pending = !!userId && q.isPending;
  useSectionReady('standoutRounds', !sessionLoading && !pending);
  useEffect(() => {
    if (q.isError) console.warn('[courses standout] read failed; section hidden');
  }, [q.isError]);

  if (sessionLoading) return <StandoutRoundsShell />;
  if (!userId) return null;
  if (pending) return <StandoutRoundsShell />;
  if (q.isError || rows.length < STANDOUT_MIN) return null;

  const tt = t as unknown as StandoutT;
  return (
    <section style={SECTION_WRAP} data-standout-rounds>
      <SectionHead tone="amber" kicker="Standout rounds" title="The last 30 days" />
      <div
        data-standout-rail
        className="scrollbar-hide"
        style={{
          ...RAIL_BLEED, gap: 10, marginTop: HEAD_GAP, alignItems: 'stretch', scrollbarWidth: 'none',
          scrollSnapType: 'x proximity', scrollPaddingInline: 16, overscrollBehaviorX: 'contain',
        }}
      >
        {rows.map((row) => (
          <RoundCard
            key={`standout:${row.whs_score_id ?? row.user_id}:${row.play_date}`}
            round={row}
            shapes={shapes}
            locale={locale}
            header={<StandoutPhotoHeader row={row} t={tt} />}
            line={standoutLine(row, tt)}
            points={row.stableford_points}
            own={row.user_id === userId}
            onOpenRound={(scoreId, owner) => opener.openByScore(scoreId, null, owner)}
            onOpenMember={(id) => opener.openProfile(id)}
          />
        ))}
      </div>
      <RoundDetailSheet
        coursesHeadingInk
        open={opener.target != null}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </section>
  );
}
