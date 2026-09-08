import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useCourseClaim, useCourseClaimStatus } from '@/hooks/useCourseClaim';
import { supabase } from '@/integrations/supabase/client';
import NearbySection from './NearbySection';
import { useCourseCoordinates } from '@/hooks/useCourseCoordinates';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CourseLocationPills from './CourseLocationPills';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { formatCourseLocation } from '@/utils/courseLocation';
import CourseFactsAndTees from './about/CourseFactsAndTees';
import AboutThisPlace from './about/AboutThisPlace';
import HowItPlays from './about/HowItPlays';
import RecordBook from './about/RecordBook';
import WhatPeopleSay from './about/WhatPeopleSay';
import WhoPlaysHere from './about/WhoPlaysHere';
import Photos from './about/Photos';
import WhereItIs from './about/WhereItIs';

import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import ClaimCourseSheet from './ClaimCourseSheet';
import CourseActionRows from './CourseActionRows';
import ClaimUnderReviewNotice from './ClaimUnderReviewNotice';
import ClaimedCourseProfileLink from './ClaimedCourseProfileLink';

import { SLATE_50 } from '@/features/courses/_shared/tokens';
/**
 * BRIEF_COURSE_TAB_REBUILD §3.10 — THE LADDER HAS MOVED, NOT GONE.
 *
 * The SI ladder (with its explainer paragraph), the par-type bars and the
 * hole-by-hole rows now render on the drill-down at /courses/:courseId/holes.
 * SiLadder, buildSiLadder and CourseAnalyticsPanels are all untouched; only the
 * surface that calls them changed, so this tab no longer imports them.
 */

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  local_area?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  country_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
  club_id?: string | null;
}

interface CourseAboutTabProps {
  course: Course;
  onTabChange?: (tab: string) => void;
}

const CourseAboutTab = ({ course, onTabChange }: CourseAboutTabProps) => {
  const { t } = useTranslation('courses');
  const [showWebsiteSheet, setShowWebsiteSheet] = useState(false);
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const { user } = useSupabaseSession();
  const [searchParams] = useSearchParams();
  const legendCategoryParam = searchParams.get('cat');
  
  
  const navigate = useNavigate();
  const { data: courseClaim } = useCourseClaim(course.id);
  const { data: claimStatus } = useCourseClaimStatus(course.id);

  const { coords, loading: coordsLoading } = useCourseCoordinates({
    courseId: course.id,
    clubId: course.club_id ?? null,
    latitude: course.latitude,
    longitude: course.longitude,
    name: course.name,
    country: course.country,
    subCountry: course.sub_country,
    region: course.region,
  });

  // Shared cached query — NearbySection uses the same params, so no extra fetch.
  const nearbyLat = coords?.lat ?? course.latitude;
  const nearbyLng = coords?.lng ?? course.longitude;
  const { data: nearbyBusinesses } = useNearbyBusinesses(nearbyLat, nearbyLng);
  const nearbyPins = React.useMemo(
    () =>
      (nearbyBusinesses ?? [])
        .filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng))
        .map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          lat: b.lat,
          lng: b.lng,
          category: b.category,
        })),
    [nearbyBusinesses],
  );


  /* §3.6 — the rating reads now live inside WhatPeopleSay, and the friends
     average is not a figure on this tab at all: the friends strip below names
     the people, which is the more useful form of the same fact. */

  const handleWebsiteClick = () => {
    if (course.website_url) {
      setShowWebsiteSheet(true);
    }
  };


  const handleRateClick = () => {
    if (!user) {
      toast("Sign in required", { description: "Please sign in to rate courses" });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${course.id}/rate`);
  };

  return (
    <div
      className="animate-in fade-in duration-200"
      style={{ paddingBottom: 8, background: SLATE_50 }}
    >
      {/* ══ BLOCK 1 — THE CARD (what the course is) ══ */}
      <CourseLocationPills course={course} />

      {/* One owner for the seams between blocks: grid gap, so a block that
          renders nothing (no tee card, no hole analytics) leaves no gap
          behind it. Fixed spacers used to strand 36px under the pills. */}
      <div style={{ display: 'grid', gap: 24 }}>
        {/* BRIEF_COURSE_TAB_REBUILD §3.1/§3.2 — flat facts row + tee control. */}
        <CourseFactsAndTees courseId={course.id} />

        {/* §3.3 — About moves UP: it is the one section that works with no data.
            The Top 100 standing is NOT repeated here: the hero badge already
            carries this course's rank, and the extra lists belong on the Top 100
            destination rather than as a footnote to the prose. */}
        <AboutThisPlace courseId={course.id} description={course.description} />

        {/* §3.4 — HOW IT PLAYS, flat. The chart, four figures and the course-wide
            distribution stay here; hole by hole, how each par plays and the SI
            ladder move behind the one drill-down (§3.10, /courses/:id/holes).
            Nothing is deleted — those components render on that page instead. */}
        <HowItPlays courseId={course.id} courseName={course.name} />

        {/* §3.5 — THE RECORD BOOK, flat. Same read as the Panel version
            (useCourseRecordSummary over get_course_legends); CourseRecordBook.tsx
            itself is untouched. It owns its own 20px gutter, so it sits OUTSIDE
            the padded block below. */}
        <RecordBook
          courseId={course.id}
          courseName={course.name}
          onSeeAll={() => onTabChange?.('legends')}
        />

        {/* §3.6 — WHAT PEOPLE SAY, flat. The score and the viewer's own score
            only; the five-bar histogram and the four category scores render on
            the Reviews tab instead (nothing deleted). */}
        <WhatPeopleSay
          courseId={course.id}
          courseName={course.name}
          onRateClick={handleRateClick}
          onSeeAllReviews={() => onTabChange?.('reviews')}
        />

        {/* §3.7 — WHO PLAYS HERE, flat. The same facepile read, no Panel; the
            circle average stays withheld (reversible, not retired). */}
        <WhoPlaysHere courseId={course.id} />

        {/* §3.8 — PHOTOS. The mosaic is unchanged; only its heading is now the
            shared section heading with localised counts. */}
        <Photos courseId={course.id} onSeeAll={() => onTabChange?.('media')} />

        {/* §3.9 — WHERE IT IS. Same map card, same cached nearby pins, now
            under a heading with the place named beside it. */}
        <WhereItIs
          courseName={course.name}
          locationText={formatCourseLocation(course)}
          coords={coords ?? null}
          coordsLoading={coordsLoading}
          nearby={nearbyPins}
        />

      {/* ══ BLOCK 4 — the remaining rows (§3.11 still to come) ══ */}
      <div style={{ display: 'grid', gap: 12, padding: '0 16px' }}>

        {/* Explore / website / claim — one collapsed panel of quiet rows */}
        <CourseActionRows
          course={course}
          onWebsiteClick={course.website_url ? handleWebsiteClick : undefined}
          onClaimClick={
            course.club_id && claimStatus?.state === 'unclaimed'
              ? () => setShowClaimSheet(true)
              : undefined
          }
        />

        {/* Claim status — pending / claimed */}
        {course.club_id && claimStatus?.state === 'pending' && <ClaimUnderReviewNotice />}
        {course.club_id && claimStatus?.state === 'claimed' && claimStatus.business && (
          <ClaimedCourseProfileLink business={claimStatus.business} />
        )}
      </div>
      </div>

      <div style={{ height: 20 }} />
      <NearbySection lat={coords?.lat ?? course.latitude} lng={coords?.lng ?? course.longitude} />

      {course.club_id && (
        <ClaimCourseSheet
          open={showClaimSheet}
          onClose={() => setShowClaimSheet(false)}
          clubId={course.club_id}
          clubName={course.name}
          sourceCourseId={course.id}
        />
      )}

      {course.website_url && (
        <ExternalLinkSheet
          isOpen={showWebsiteSheet}
          onClose={() => setShowWebsiteSheet(false)}
          url={course.website_url}
          title={`${course.name || 'Course'} Website`}
        />
      )}

      <ScrollToTopGlass />
    </div>
  );
};

export default CourseAboutTab;
