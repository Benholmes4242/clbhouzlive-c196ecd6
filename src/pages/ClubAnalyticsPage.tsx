/**
 * BRIEF_CLUB_ANALYTICS_MULTI_COURSE — the Club Analytics surface.
 *
 * WHAT THIS IS: a page inside Manage business profiles, for VERIFIED GOLF CLUBS
 * ONLY, showing what actually happens on their golf course. Nothing here is a
 * member's round: it is the club's course, measured, in aggregate.
 *
 * ONE BLOCK PER COURSE (§2). The old page picked ONE course and everything else
 * was unreachable — Sundridge Park owns two and only East could ever be seen.
 * `club_courses` from the RPC now drives a collapsible block per course. The
 * default-open block fetches on mount; the rest fetch when first expanded, so a
 * club with four courses does not fire four RPCs to show one.
 *
 * THE EMPTY STATE DOES NOT ASSERT WHAT IT CANNOT KNOW (§1). The RPC returns no
 * rows both when the caller is not entitled and when there is no data, so the
 * page never claims a course has no rounds.
 *
 * BEN RUNS ALL SQL. The RPC is live and is not created or patched here.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  A, SANS, FIGS, LABEL, BIZ_BODY, BIZ_TITLE, Panel,
} from '@/features/courses/components/holes/analytical/tokens';
import { useClubCourseLink } from '@/features/business/clubAnalytics/useClubCourseLink';
import { useClubCourseAnalytics } from '@/features/business/clubAnalytics/useClubCourseAnalytics';
import {
  VerdictStrip, IndexDisagreesSection, SampleSection, HoleBySection, StrokeIndexSection,
  ScoringSection, RecordBookSection, TeesSection, SeasonalitySection, WhoPlaysSection,
  CompetitionSection,
} from '@/features/business/clubAnalytics/sections';

import type { ClubCourseRef } from '@/features/business/clubAnalytics/types';

const TITLE = 'Your course';

/** One shape for every "we cannot show this, and here is exactly why" state.
 *  It never renders empty charts. */
function Notice({ kicker, headline, body }: { kicker: string; headline: string; body: string }) {
  return (
    <div style={{ padding: '4px 16px 0' }}>
      <Panel kicker={kicker}>
        <div style={{ ...BIZ_TITLE, marginBottom: 8 }}>{headline}</div>
        <p style={{ ...BIZ_BODY, margin: 0 }}>{body}</p>
      </Panel>
    </div>
  );
}

/* ───────────────────────── ONE COURSE BLOCK ───────────────────────── */

/**
 * §2 — a collapsible block, headed by the course name. It fetches ONLY once it
 * has been opened: `openedOnce` gates the query, so a collapsed block costs
 * nothing.
 *
 * BRIEF_CLUB_COURSES_ROUND_COUNTS §2 — the COLLAPSED head states its round
 * count from `club_courses`, never from a fetch. That count is the whole point
 * of the RPC change; fetching a collapsed course to fill its header would undo
 * it. The EXPANDED header — members, rounds, date range — comes from that
 * course's own response, via SampleSection.
 */
const CourseBlock: React.FC<{
  course: ClubCourseRef;
  open: boolean;
  onToggle: () => void;
}> = ({ course, open, onToggle }) => {
  const [openedOnce, setOpenedOnce] = React.useState(open);
  React.useEffect(() => {
    if (open) setOpenedOnce(true);
  }, [open]);

  const navigate = useNavigate();
  const { data: result, isLoading } = useClubCourseAnalytics(course.course_id, openedOnce);


  return (
    /* BRIEF_CLUB_ANALYTICS_PAGE_REBUILD §1 — THE BLOCK IS NO LONGER A CARD.
       It was one tall panel with every section ruled off inside it, which is
       why the page read as an endless tile. The head is now a bare heading row
       on the canvas and each section is its own card beneath it. */
    <section>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          padding: '4px 2px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ ...BIZ_TITLE, display: 'block' }}>{course.course_name}</span>
          {!open && (
            <span style={{ ...LABEL, display: 'block', marginTop: 5 }}>
              {course.rounds.toLocaleString()} {course.rounds === 1 ? 'round' : 'rounds'}
            </span>
          )}
        </span>

        <ChevronDown
          size={18}
          color={A.MUTE}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
        />
      </button>

      {open && (
        /* §1 — 14px between cards, and the cards carry their own 16px padding. */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isLoading && (
            <>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </>
          )}

          {/* §1 — an error is NOT "no rounds". The reason is logged, not shown. */}
          {!isLoading && result?.state === 'unavailable' && (
            <Panel kicker="Not loaded" style={{ borderRadius: 12 }}>
              <div style={{ ...BIZ_TITLE, marginBottom: 8 }}>We could not load this measurement</div>
              <p style={{ ...BIZ_BODY, margin: 0 }}>
                Something went wrong reading the figures for this course. Nothing is missing from your side — try again
                shortly, and if it persists we will pick it up from our logs.
              </p>
            </Panel>
          )}

          {!isLoading && result?.state === 'empty' && (
            <Panel kicker="Not available" style={{ borderRadius: 12 }}>
              <div style={{ ...BIZ_TITLE, marginBottom: 8 }}>Measurement is not available for this course yet</div>
              <p style={{ ...BIZ_BODY, margin: 0 }}>
                We are not able to show figures for this course at the moment. There is nothing for you to configure —
                when it becomes available it appears here.
              </p>
            </Panel>
          )}

          {!isLoading && result?.state === 'ok' && (
            <>
              {/* §1b — THE VERDICT STRIP LEADS: mean gross, hardest hole, comp share. */}
              <VerdictStrip data={result.data} />
              {/* §2 — the ladder is the one thing no other product shows a club. */}
              <IndexDisagreesSection data={result.data} />
              {/* §7 — the sample is stated before the rest of the figures. */}
              <SampleSection data={result.data} />
              <HoleBySection data={result.data} />
              <StrokeIndexSection data={result.data} />
              <ScoringSection data={result.data} />
              {/* §5 — values only. Names live on the course's Champions tab. */}
              <RecordBookSection
                data={result.data}
                onSeeChampions={() => navigate(`/courses/${course.course_id}?tab=legends`)}
              />
              <TeesSection data={result.data} />
              <SeasonalitySection data={result.data} />
              <WhoPlaysSection data={result.data} />
              <CompetitionSection data={result.data} />
            </>
          )}
        </div>
      )}
    </section>
  );
};


/* ───────────────────────── THE PAGE ───────────────────────── */

export default function ClubAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useHideBottomNav();

  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: link, isLoading: linkLoading } = useClubCourseLink({
    businessId: business?.id,
    category: business?.category,
    isVerified: business?.is_verified,
    clubId: business?.club_id,
  });

  const seedId = link?.state === 'seed' ? link.courseId : undefined;
  const { data: seed, isLoading: seedLoading } = useClubCourseAnalytics(seedId);

  const [openId, setOpenId] = React.useState<string | null>(null);


  if (businessLoading || linkLoading) {
    return (
      <ManagePageShell title={TITLE}>
        <div className="space-y-3 px-4 pt-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  if (!business) {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker="Not found"
          headline="We could not open this business"
          body="The profile may have been removed, or you may no longer have access to it."
        />
      </ManagePageShell>
    );
  }

  /* ── THE GATE. Unchanged states, unchanged copy. ── */

  if (link?.state === 'not_a_club') {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker="Golf clubs only"
          headline="This surface measures a golf course"
          body="Course analytics are for profiles listed as a Golf Club, because everything here is drawn from rounds played on a course."
        />
      </ManagePageShell>
    );
  }

  if (link?.state === 'unverified') {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker="Verification required"
          headline="Verify your club to see how your course plays"
          body="What members score on your holes is your club's own data, so we release it only to a verified club. Verification lives in your business settings."
        />
      </ManagePageShell>
    );
  }

  if (link?.state === 'unclaimed') {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker="No course linked"
          headline="Your claim is not yet attached to a course"
          body="Course analytics follow the course your club claim resolves to. Once that link is in place, this page fills itself in — there is nothing for you to set up."
        />
      </ManagePageShell>
    );
  }

  if (seedLoading) {
    return (
      <ManagePageShell title={TITLE}>
        <div className="space-y-3 px-4 pt-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  // §1 — no rows means "not available", NEVER "this course has no rounds".
  if (!seed || seed.state !== 'ok') {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker={link?.state === 'seed' ? link.courseName : 'Your course'}
          headline={
            seed?.state === 'unavailable'
              ? 'We could not load this measurement'
              : 'Measurement is not available for your course yet'
          }
          body={
            seed?.state === 'unavailable'
              ? 'Something went wrong reading the figures for your course. Nothing is missing from your side — try again shortly, and if it persists we will pick it up from our logs.'
              : 'We are not able to show figures for this club at the moment. There is nothing for you to configure — when it becomes available it appears here.'
          }
        />
      </ManagePageShell>
    );
  }

  // club_courses supersedes any client-side course picking. Fall back to the
  // course the RPC answered about, so a club always sees at least its own block.
  const courses: ClubCourseRef[] = seed.data.club_courses.length
    ? seed.data.club_courses
    : [{ course_id: seed.data.course_id, course_name: seed.data.course_name, rounds: seed.data.rounds }];

  // §1 — the default-open block is club_courses[0] (ordered rounds DESC, then
  // name), NOT the seed. The seed only existed to make the first call; if it is
  // not [0] its response stays in the react-query cache under its own course id,
  // so expanding that block later costs no request.
  const defaultOpen = courses[0]?.course_id ?? null;
  const effectiveOpen = openId ?? defaultOpen;


  return (
    <ManagePageShell title={TITLE}>
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {courses.length > 1 && (
          <p style={{ ...BIZ_BODY, margin: 0, fontSize: 12.5 }}>
            Your club has {courses.length} courses. Each is measured on its own — a stroke index belongs to a course, so
            we never average them together.
          </p>
        )}

        {courses.map((c) => (
          <CourseBlock
            key={c.course_id}
            course={c}
            open={effectiveOpen === c.course_id}
            onToggle={() => setOpenId(effectiveOpen === c.course_id ? '' : c.course_id)}
          />
        ))}

        <p style={{ ...BIZ_BODY, fontSize: 11.5, margin: 0, color: A.DIM }}>
          Everything on this page is an aggregate across rounds played on your courses. No individual member, round or
          score is shown here, and none is available to your club.
        </p>

        <button
          type="button"
          onClick={() => navigate(`/business/${business.id}/insights`)}
          style={{
            alignSelf: 'flex-start',
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: 12.5,
            fontWeight: 600,
            color: A.MUTE,
            cursor: 'pointer',
          }}
        >
          See profile insights
        </button>
      </div>
    </ManagePageShell>
  );
}
