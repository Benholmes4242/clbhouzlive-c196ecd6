/**
 * BRIEF_CLUB_ANALYTICS_TAB — the Club Analytics surface.
 *
 * WHAT THIS IS: a tab inside Manage business profiles, for VERIFIED GOLF CLUBS
 * ONLY, showing what actually happens on their golf course — led by whether
 * their stroke index is right. That verdict is the product; the rest supports
 * it. Nothing here is a member's round: it is the club's course, measured.
 *
 * ALL THREE STATES ARE BUILT and all three come out of the same code path,
 * because they are the same page with different data:
 *   A  A CARD THAT IS OUT     verdict names the largest disagreement (Hanbury)
 *   B  A CARD THAT IS SOUND   verdict pays the compliment (Sundridge)
 *   C  EARLY DATA             every section renders, the n reads "Early data",
 *                             the verdict's verb softens, handicap withdraws
 *
 * ELIGIBILITY IS A GATE, NOT A DISCLAIMER (§2). Category, verification and a
 * resolved course must all hold. A multi-course club with no specific course
 * REPORTS AND STOPS — a stroke index belongs to a course, and merging two
 * courses' holes would produce a verdict for a course that does not exist.
 *
 * BEN RUNS ALL SQL. The one RPC this reads is not created here.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  A, BIZ_KICKER, BIZ_BODY, BIZ_TITLE, Panel,
} from '@/features/courses/components/holes/analytical/tokens';
import { useClubCourseLink } from '@/features/business/clubAnalytics/useClubCourseLink';
import { useClubCourseAnalytics } from '@/features/business/clubAnalytics/useClubCourseAnalytics';
import {
  VerdictSection, HowItPlaysSection, ScoringSection, BusynessSection, WhoPlaysSection,
} from '@/features/business/clubAnalytics/sections';
import { EARLY_DATA_FLOOR } from '@/features/business/clubAnalytics/constants';

const TITLE = 'Your course';

/** One shape for every "we cannot show this, and here is exactly why" state.
 *  It never renders empty charts — that was the Insights fault (§6.2). */
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

  const courseId = link?.state === 'resolved' ? link.courseId : undefined;
  const { data, isLoading: dataLoading } = useClubCourseAnalytics(courseId);

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

  /* ── §2 ELIGIBILITY ── */

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

  // §2.1 — MULTI-COURSE CLUBS. Report and stop; never merge.
  if (link?.state === 'ambiguous') {
    return (
      <ManagePageShell title={TITLE}>
        <div style={{ padding: '4px 16px 0' }}>
          <Panel kicker="More than one course">
            <div style={{ ...BIZ_TITLE, marginBottom: 8 }}>
              {link.clubName ?? 'Your club'} has {link.courses.length} courses
            </div>
            <p style={{ ...BIZ_BODY, margin: 0, marginBottom: 12 }}>
              A stroke index belongs to a course, not to a club, so we will not average your courses together — the
              verdict would describe a course that does not exist. Your claim needs to point at one of these before
              this page can measure it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {link.courses.map((c) => (
                <div
                  key={c.id}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: A.INK,
                    borderTop: `1px solid ${A.HAIRLINE}`,
                    paddingTop: 8,
                  }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </ManagePageShell>
    );
  }

  if (dataLoading) {
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

  // The RPC is absent, or the caller is not permitted, or no round has landed.
  // We say so plainly rather than drawing an empty page (§6.2).
  if (!data || data.rounds === 0 || data.holes.length === 0) {
    return (
      <ManagePageShell title={TITLE}>
        <Notice
          kicker={link?.state === 'resolved' ? link.courseName : 'Your course'}
          headline="No measured rounds yet"
          body="Nothing has been scored hole by hole on this course through Clbhouz yet. As soon as rounds land, your stroke index gets checked against them here — there is nothing to configure."
        />
      </ManagePageShell>
    );
  }

  const early = data.rounds < EARLY_DATA_FLOOR;

  return (
    <ManagePageShell title={TITLE}>
      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* The course this page is about, named once, at the top. */}
        <div>
          <div style={BIZ_KICKER}>{data.course_name}</div>
          <p style={{ ...BIZ_BODY, margin: '6px 0 0', fontSize: 12.5 }}>
            {early
              ? `We hold ${data.rounds.toLocaleString()} ${data.rounds === 1 ? 'round' : 'rounds'} on this course. Everything below is real, and it reads as a signal rather than a finding until ${EARLY_DATA_FLOOR} rounds have landed.`
              : `Drawn from ${data.rounds.toLocaleString()} rounds played here, hole by hole.`}
          </p>
        </div>

        {/* §4 — the five sections, in order. */}
        <VerdictSection data={data} />
        <HowItPlaysSection data={data} />
        <ScoringSection data={data} />
        <BusynessSection data={data} />
        <WhoPlaysSection data={data} />

        <p style={{ ...BIZ_BODY, fontSize: 11.5, margin: 0, color: A.DIM }}>
          Everything on this page is an aggregate across rounds played on your course. No individual member, round or
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
