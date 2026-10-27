/**
 * CB106 — golf club profile, section 4: "What golfers say". Club profiles
 * only, placed directly after "How it plays". Ratings are ALL WHITE (the
 * app-wide decision of 27 Oct): no green, no grey-by-score anywhere.
 *
 * Totals, average and sub-scores come from useBusinessReviewStats (the same
 * read as the hero's rating cell, so the two always agree); the quoted review
 * is useClubLatestReview. The Rate it pill is shown only to a signed-in
 * viewer who is not on this business's team; it opens the app's existing
 * review composer route (/courses/:courseId/rate, the same entry the course
 * page's Reviews tab uses), via a course picker sheet on multi-course clubs.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { useClubLatestReview, type ClubLatestReview } from '@/hooks/useClubLatestReview';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { courseActivityClubName, courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { formatNumber } from '@/i18n/format';
import type { BusinessClubCourse } from './ClubHowItPlays';

const T = {
  card: '#17171B', ink: '#F8FAFC', mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)', hair: 'rgba(255,255,255,0.08)',
  track: 'rgba(255,255,255,0.06)', fill: 'rgba(248,250,252,0.78)',
  body: 'rgba(248,250,252,0.82)', chip: 'rgba(255,255,255,0.08)',
  pillBg: 'rgba(255,255,255,0.07)', pillBorder: 'rgba(255,255,255,0.14)',
} as const;
const TAB = { fontVariantNumeric: 'tabular-nums' } as const;

/** "{d MMM}", with the year added when it is not the current year. */
export function reviewMetaDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-GB', opts);
}

const SUB_ORDER = [
  ['design', 'Design'],
  ['condition', 'Condition'],
  ['facilities', 'Facilities'],
  ['clubhouse', 'Clubhouse'],
] as const;

function LatestReview({ review, courses, onOpen }: {
  review: ClubLatestReview; courses: BusinessClubCourse[]; onOpen: (courseId: string) => void;
}) {
  const course = courses.find((c) => c.id === review.course_id);
  const courseName = courses.length > 1 && course ? courseNameWithinClub(course.name) : null;
  const date = review.review_date ? reviewMetaDate(review.review_date) : null;
  const meta = [courseName, date].filter(Boolean).join(' · ');
  return (
    <button type="button" data-club-say-review onClick={() => onOpen(review.course_id)}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0,
        margin: '14px 0 0', padding: '14px 0 0', borderTop: `1px solid ${T.hair}`,
        color: 'inherit', font: 'inherit', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <SquircleAvatar size={28} src={review.user_profiles?.profile_photo_url ?? null}
          alt={review.user_profiles?.display_name ?? ''} userId={review.user_id} hairlineRing />
        <b style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{review.user_profiles?.display_name ?? ''}</b>
        {review.rating != null && (
          <span data-club-say-chip style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
            background: T.chip, color: T.ink, ...TAB }}>{review.rating.toFixed(1)}</span>
        )}
      </div>
      <p data-club-say-text style={{ fontSize: 13.5, lineHeight: 1.5, color: T.body, margin: '8px 0 0',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {review.review}
      </p>
      {meta && <small style={{ display: 'block', fontSize: 12, color: T.dim, marginTop: 6 }}>{meta}</small>}
    </button>
  );
}

export function ClubWhatGolfersSay({ isClub, businessId, businessName, courses, viewerId, isTeamMember }: {
  isClub: boolean; businessId: string; businessName: string;
  courses: BusinessClubCourse[]; viewerId?: string; isTeamMember?: boolean;
}) {
  const navigate = useNavigate();
  const statsQuery = useBusinessReviewStats(businessId);
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const latestQuery = useClubLatestReview(courseIds);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!isClub || courses.length === 0 || statsQuery.isLoading) return null;
  const stats = statsQuery.data;
  const total = stats?.totalReviews ?? 0;
  const canRate = !!viewerId && !isTeamMember;

  const openRate = (courseId: string) => {
    setPickerOpen(false);
    navigate(`/courses/${courseId}/rate`);
  };
  const onRate = () => {
    if (courses.length === 1) openRate(courses[0].id);
    else setPickerOpen(true);
  };

  const ratePill = canRate ? (
    <button type="button" data-club-say-rate onClick={onRate}
      style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 999,
        fontSize: 13.5, fontWeight: 600, background: T.pillBg, border: `1px solid ${T.pillBorder}`,
        color: T.ink, whiteSpace: 'nowrap', flex: 'none', cursor: 'pointer' }}>
      Rate it
    </button>
  ) : null;

  const picker = (
    <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} ariaLabelledBy="club-say-picker-title">
      <div style={{ padding: '0 16px 26px' }}>
        <div id="club-say-picker-title" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: T.ink, marginBottom: 12 }}>
          Which course did you play?
        </div>
        {courses.map((c) => (
          <button key={c.id} type="button" data-club-say-pick={c.id} onClick={() => openRate(c.id)}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderTop: `1px solid ${T.hair}`, background: 'transparent', border: 'none',
              borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: T.hair,
              fontSize: 15, fontWeight: 600, color: T.ink, cursor: 'pointer', textAlign: 'left' }}>
            {courseNameWithinClub(c.name)}
            <span style={{ fontSize: 12.5, color: T.dim, fontWeight: 400 }}>›</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );

  if (total === 0) {
    // No reviews: an invitation for signed-in non-team viewers; no card otherwise.
    if (!canRate) return null;
    return (
      <section data-club-what-say style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: 18, padding: 16, margin: '14px 16px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute, marginBottom: 10 }}>
          What golfers say
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, color: T.ink, margin: 0 }}>
          No one has reviewed {courseActivityClubName(businessName)} yet.
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 12 }}>
          <span style={{ fontSize: 13.5, color: T.mute }}>Played it? Be the first.</span>
          {ratePill}
        </div>
        {picker}
      </section>
    );
  }

  const subRows = SUB_ORDER.flatMap(([key, label]) => {
    const value = stats?.subRatings?.[key];
    return value == null ? [] : [{ key, label, value }];
  });
  const reviewedCourses = (stats?.courses ?? []).filter((c) => c.reviewCount > 0);
  const latest = latestQuery.data ?? null;

  return (
    <section data-club-what-say style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: 18, padding: 16, margin: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>What golfers say</div>
        <div data-club-say-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
          {total === 1 ? '1 review' : `${formatNumber(total)} reviews`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <b data-club-say-rating style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: T.ink, ...TAB }}>
          {(stats?.avgRating ?? 0).toFixed(1)}
        </b>
        <span style={{ fontSize: 13.5, color: T.mute }}>out of 10</span>
      </div>

      {subRows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {subRows.map((row) => (
            <div key={row.key} data-club-say-sub={row.key}
              style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr) 30px', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, ...TAB }}>
              <span style={{ color: T.mute }}>{row.label}</span>
              <span style={{ height: 6, borderRadius: 3, background: T.track, overflow: 'hidden', display: 'block' }}>
                <i data-club-say-fill style={{ display: 'block', height: '100%', width: `${row.value * 10}%`, background: T.fill, borderRadius: 3 }} />
              </span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: T.ink }}>{row.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {latest && <LatestReview review={latest} courses={courses} onOpen={(id) => navigate(`/courses/${id}/reviews`)} />}

      {courses.length === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 12 }}>
          <button type="button" data-club-say-read-all onClick={() => navigate(`/courses/${courses[0].id}/reviews`)}
            style={{ background: 'transparent', border: 0, padding: 0, fontSize: 14, fontWeight: 600, color: T.ink, cursor: 'pointer' }}>
            Read all {formatNumber(total)} reviews ›
          </button>
          {ratePill}
        </div>
      ) : (
        <>
          {reviewedCourses.map((c, i) => (
            <button key={c.id} type="button" data-club-say-course={c.id} onClick={() => navigate(`/courses/${c.id}/reviews`)}
              style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0', marginTop: i === 0 ? 14 : 0, background: 'transparent', border: 'none',
                borderTop: `1px solid ${T.hair}`, fontSize: 14, color: T.ink, cursor: 'pointer', textAlign: 'left' }}>
              <b style={{ fontWeight: 600 }}>{courseNameWithinClub(c.name)} reviews</b>
              <span style={{ color: T.dim, fontSize: 12.5, ...TAB }}>{formatNumber(c.reviewCount)} ›</span>
            </button>
          ))}
          {canRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 12 }}>
              <span style={{ fontSize: 13.5, color: T.mute }}>Played it?</span>
              {ratePill}
            </div>
          )}
        </>
      )}
      {picker}
    </section>
  );
}
