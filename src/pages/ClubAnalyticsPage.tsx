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
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { RailChips } from '@/components/ui/RailChips';
import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  A, BIZ_BODY, BIZ_TITLE, Panel,
} from '@/features/courses/components/holes/analytical/tokens';
import { useClubCourseLink } from '@/features/business/clubAnalytics/useClubCourseLink';
import { useClubCourseAnalytics } from '@/features/business/clubAnalytics/useClubCourseAnalytics';
import {
  VerdictStrip, IndexDisagreesSection, SampleSection, HoleBySection,
  ScoringSection, RecordBookSection, TeesSection, SeasonalitySection, WhoPlaysSection,
  CompetitionSection,
} from '@/features/business/clubAnalytics/sections';

import type { ClubCourseRef } from '@/features/business/clubAnalytics/types';
import { useQuery } from '@tanstack/react-query';
import { fetchGolfClub } from '@/features/business/claimClub';
import { RequestAnotherCourseSheet } from '@/components/business/RequestAnotherCourseSheet';

const TITLE = 'Your course';
/** §4 — plural when the club owns more than one course. */
const titleFor = (n: number) => (n > 1 ? 'Your courses' : 'Your course');

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

/**
 * §2 — A SECTION THROWING COSTS THAT SECTION, NOT THE PAGE. Reuses the app's
 * existing ErrorBoundary (the one AppShell mounts) with a card-shaped fallback,
 * so a single null formatter can no longer send a club to "Something went
 * wrong". No new boundary pattern was introduced.
 */
const SectionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <Panel kicker="Not shown" style={{ borderRadius: 12, padding: 16 }}>
        <p style={{ ...BIZ_BODY, margin: 0 }}>
          This part of the page could not be drawn. The rest of your figures are unaffected.
        </p>
      </Panel>
    }
  >
    {children}
  </ErrorBoundary>
);

/* ───────────────────────── ONE COURSE BLOCK ───────────────────────── */

/**
 * BRIEF_CLUB_COURSES_TO_PILLS_AND_REVIEW_COUNTS — the block has no head. The
 * course name and round count live in the chip; members, rounds and range live
 * in The sample. It fetches only the course it is given, so one selection is
 * one RPC and a re-selected course is served from the react-query cache.
 */
const CourseBlock: React.FC<{ course: ClubCourseRef }> = ({ course }) => {
  const navigate = useNavigate();
  const { data: result, isLoading } = useClubCourseAnalytics(course.course_id);

  return (
    <section>
        {/* §1 — 14px between cards, and the cards carry their own 16px padding. */}
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
              <SectionGuard><VerdictStrip data={result.data} /></SectionGuard>
              {/* §7 — the sample is stated before the rest of the figures. */}
              <SectionGuard><SampleSection data={result.data} /></SectionGuard>
              <SectionGuard><HoleBySection data={result.data} /></SectionGuard>
              {/* §2 — the ladder is the one thing no other product shows a club. */}
              <SectionGuard><IndexDisagreesSection data={result.data} /></SectionGuard>
              <SectionGuard><ScoringSection data={result.data} /></SectionGuard>
              {/* §5 — values only. Names live on the course's Champions tab. */}
              <SectionGuard>
                <RecordBookSection
                  data={result.data}
                  onSeeChampions={() => navigate(`/courses/${course.course_id}?tab=legends`)}
                />
              </SectionGuard>
              <SectionGuard><TeesSection data={result.data} /></SectionGuard>
              <SectionGuard><SeasonalitySection data={result.data} /></SectionGuard>
              <SectionGuard><WhoPlaysSection data={result.data} /></SectionGuard>
              <SectionGuard><CompetitionSection data={result.data} /></SectionGuard>
            </>
          )}
        </div>
    </section>
  );
};


/* ─────────────── BRIEF_CLUB_REQUEST_ANOTHER_COURSE §2 ─────────────── */

/** A text button in the page's idiom that opens the request sheet. `compact`
 *  (top of the course list) is a single "+" line; the `unclaimed` notice keeps
 *  its explanatory caption. */
const RequestAnotherCourse: React.FC<{
  businessId: string;
  businessName: string;
  clubId: string;
  fallbackClubName: string | null;
  existingCourses: { course_id: string; course_name: string }[];
  compact?: boolean;
}> = ({ businessId, businessName, clubId, fallbackClubName, existingCourses, compact = false }) => {
  const [open, setOpen] = React.useState(false);
  const { data: club } = useQuery({
    queryKey: ['golf-club', clubId],
    queryFn: () => fetchGolfClub(clubId),
    staleTime: 5 * 60_000,
  });
  const clubName = club?.name ?? fallbackClubName ?? businessName;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {!compact && (
        <p style={{ ...BIZ_BODY, fontSize: 11.5, margin: 0, color: A.DIM }}>
          Missing a course? Tell us and we will add it to your club.
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
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
        {compact ? '+ Request another course' : 'Request another course ›'}
      </button>
      <RequestAnotherCourseSheet
        open={open}
        onClose={() => setOpen(false)}
        businessId={businessId}
        businessName={businessName}
        clubId={clubId}
        clubName={clubName}
        existingCourses={existingCourses}
      />
    </div>
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

  const [selectedId, setSelectedId] = React.useState<string | null>(null);


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
        {business.club_id && (
          <div style={{ padding: '16px 16px 0' }}>
            <RequestAnotherCourse
              businessId={business.id}
              businessName={business.name}
              clubId={business.club_id}
              fallbackClubName={business.club_name ?? null}
              existingCourses={[]}
            />
          </div>
        )}
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

  // Default selection is club_courses[0] (rounds DESC, then name), NOT the seed.
  // The seed's response stays cached under its own id, so choosing it costs nothing.
  const selected = courses.find((c) => c.course_id === selectedId) ?? courses[0];


  return (
    <ManagePageShell title={titleFor(courses.length)}>
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {courses.length > 1 && (
          <p style={{ ...BIZ_BODY, margin: 0, fontSize: 12.5 }}>
            Your club has {courses.length} courses. Each is measured on its own — a stroke index belongs to a course, so
            we never average them together.
          </p>
        )}

        {courses.length > 1 && (
          <RailChips
            options={courses.map((c) => ({
              id: c.course_id,
              label: courseNameWithinClub(c.course_name),
              value: c.rounds,
            }))}
            value={selected.course_id}
            onChange={setSelectedId}
            ariaLabel="Course"
          />
        )}

        {business.club_id && (
          <RequestAnotherCourse
            compact
            businessId={business.id}
            businessName={business.name}
            clubId={business.club_id}
            fallbackClubName={business.club_name ?? null}
            existingCourses={courses.map((c) => ({ course_id: c.course_id, course_name: c.course_name }))}
          />
        )}

        {selected && <CourseBlock key={selected.course_id} course={selected} />}

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
