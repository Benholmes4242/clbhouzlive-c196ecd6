import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useCourseClaim, useCourseClaimStatus } from '@/hooks/useCourseClaim';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import AboutMediaStrip from './AboutMediaStrip';
import NearbySection from './NearbySection';
import { useCourseCoordinates } from '@/hooks/useCourseCoordinates';
import { LocationMapCard } from '@/components/map';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseRatingDistribution } from '@/hooks/useCourseRatingDistribution';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { toast } from '@/lib/toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CourseFriendsStrip } from '@/components/golf-club/CourseFriendsStrip';
import CourseLocationPills from './CourseLocationPills';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { formatCourseLocation } from '@/utils/courseLocation';
import CommunityScoreCard from './CommunityScoreCard';
import { CourseTop100RankRow } from './CourseTop100RankRow';
import { CourseCardPanel } from '@/features/courses/components/holes/analytical/CourseCardPanel';
import { CourseAnalyticsPanels } from '@/features/courses/components/holes/analytical/CourseAnalyticsPanels';

import CourseRecordBook from './CourseRecordBook';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import ClaimCourseSheet from './ClaimCourseSheet';
import CourseActionRows from './CourseActionRows';
import ClaimUnderReviewNotice from './ClaimUnderReviewNotice';
import ClaimedCourseProfileLink from './ClaimedCourseProfileLink';

import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { A, Action, Panel } from '@/features/courses/components/holes/analytical/tokens';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';

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

const formatDescription = (description: string | null | undefined) => {
  if (!description) return null;
  return description
    .split('\n')
    .map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
};

const CourseAboutTab = ({ course, onTabChange }: CourseAboutTabProps) => {
  const { t } = useTranslation('courses');
  const [showFullDescription, setShowFullDescription] = useState(false);
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


  const { data: ratingAggregates, isLoading: ratingAggregatesLoading } = useCourseRatingAggregates(course.id);
  const { data: distribution } = useCourseRatingDistribution(course.id);
  const { data: userRating } = useUserCourseRating(course.id, user?.id);

  // Friends' average rating - the same cached query CourseFriendsStrip uses.
  const { data: friendsRated = [] } = useFriendsWhoPlayedCourse(user?.id, course.id);
  const friendsAvg = React.useMemo(() => {
    const scored = friendsRated.filter((f) => f.rating_value != null);
    if (scored.length === 0) return null;
    return scored.reduce((sum, f) => sum + (f.rating_value ?? 0), 0) / scored.length;
  }, [friendsRated]);

  const handleWebsiteClick = () => {
    if (course.website_url) {
      setShowWebsiteSheet(true);
    }
  };

  const shouldShowReadMore = course.description && course.description.split(' ').length > 50;


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
        <CourseCardPanel courseId={course.id} courseName={course.name} />

        {/* ══ BLOCK 2 — HOW IT PLAYS / HOLE BY HOLE (analytical panels) ══ */}
        <CourseAnalyticsPanels courseId={course.id} />

      {/* ══ BLOCK 3 — WHO PLAYS HERE (the people) ══ */}
      <div style={{ display: 'grid', gap: 12, padding: '0 16px' }}>
        <CourseRecordBook
          courseId={course.id}
          courseName={course.name}
          courseRegion={course.region ?? null}
          courseCountry={course.country ?? null}
          courseType={(course as { course_type?: string | null }).course_type ?? null}
          initialCategory={legendCategoryParam}
          onSeeAll={() => onTabChange?.('legends')}
        />

        <CommunityScoreCard
          courseId={course.id}
          courseName={course.name}
          ratingAggregates={ratingAggregates}
          isLoading={ratingAggregatesLoading}
          userRating={userRating}
          distribution={distribution}
          friendsAvg={friendsAvg}
          onRateClick={handleRateClick}
          onSeeAllReviews={() => onTabChange?.('reviews')}
        />

        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
      </div>

      {/* ══ BLOCK 4 — ABOUT THIS PLACE (everything that is not analytics) ══ */}
      <div style={{ display: 'grid', gap: 12, padding: '0 16px' }}>
        {(course.description || course.id) && (
          <Panel kicker={t('courseDetail.blocks.aboutThisPlace')}>
            {course.description && (
            <div
              style={{
                fontSize: 13.5,
                color: A.MUTE,
                lineHeight: 1.65,
                ...(showFullDescription
                  ? {}
                  : {
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }),
              }}
            >
              {formatDescription(course.description)}
            </div>
            )}
            {shouldShowReadMore && (
              <Action
                label={showFullDescription ? t('courseDetail.about.showLess') : t('courseDetail.about.readMore')}
                onClick={() => setShowFullDescription(!showFullDescription)}
                align="left"
              />
            )}
            {course.id && <CourseTop100RankRow courseId={course.id} />}
          </Panel>
        )}

        {/* Location */}
        {coordsLoading && <Skeleton className="w-full h-[180px] rounded-xl" />}
        {coords && (
          <LocationMapCard
            lat={coords.lat}
            lng={coords.lng}
            name={course.name}
            locationText={formatCourseLocation(course)}
            colorful
            nearby={nearbyPins}
          />
        )}
        {!coords && !coordsLoading && (
          <p style={{ fontSize: 13, color: A.DIM, margin: 0 }}>
            {t('courseDetail.about.locationUnavailable')}
          </p>
        )}

        {/* Media */}
        <AboutMediaStrip clubId={course.id} onSeeAllClick={() => onTabChange?.('media')} />

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
