import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useCourseClaim, useCourseClaimStatus } from '@/hooks/useCourseClaim';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Pencil, BookOpen, BarChart3, MapPin, Quote } from 'lucide-react';
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
import CourseExploreLinks from './CourseExploreLinks';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { CourseTop100Summary } from './CourseTop100Summary';
import { formatCourseLocation } from '@/utils/courseLocation';
import CommunityScoreCard from './CommunityScoreCard';
import { CourseTop100Spotlight } from './CourseTop100Spotlight';
import CourseHolesTab from '@/features/courses/components/holes/CourseHolesTab';
import { CourseTeeCard } from '@/features/courses/components/holes/CourseTeeCard';

import CourseRecordBook from './CourseRecordBook';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import ClaimCourseCTA from './ClaimCourseCTA';
import ClaimUnderReviewNotice from './ClaimUnderReviewNotice';
import ClaimedCourseProfileLink from './ClaimedCourseProfileLink';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { AMBER, HAIRLINE_INK_7, INK_FAINT, SLATE_50, SLATE_600 } from '@/features/courses/_shared/tokens';

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

const formatDescription = (description: string) => {
  return description
    .split('\n')
    .map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
};

const Divider = () => (
  <div style={{ height: '0.5px', background: HAIRLINE_INK_7, margin: '0 16px' }} />
);

const CourseAboutTab = ({ course, onTabChange }: CourseAboutTabProps) => {
  const { t } = useTranslation('courses');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showWebsiteSheet, setShowWebsiteSheet] = useState(false);
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


  const { data: ratingAggregates } = useCourseRatingAggregates(course.id);
  const { data: distribution } = useCourseRatingDistribution(course.id);
  const { data: userRating } = useUserCourseRating(course.id, user?.id);

  const handleWebsiteClick = () => {
    if (course.website_url) {
      setShowWebsiteSheet(true);
    }
  };

  const truncateDescription = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ');
  };

  const shouldShowReadMore = course.description && course.description.split(' ').length > 50;
  const displayDescription = course.description && !showFullDescription && shouldShowReadMore
    ? truncateDescription(course.description, 50)
    : course.description;

  // Fire once per mount when the collapsed hole table is opened.
  const holesExpandFired = React.useRef(false);
  const handleHolesExpand = React.useCallback(() => {
    if (holesExpandFired.current) return;
    holesExpandFired.current = true;
    analyticsEvents.track('course_holes_expanded', { course_id: course.id });
  }, [course.id]);

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
      style={{ paddingBottom: 32, background: SLATE_50 }}
    >
      {/* ══ BLOCK 1 — THE CARD (what the course is) ══ */}
      <SectionHeader role="section" kicker={t('courseDetail.blocks.theCard')} paddingX={16} />
      <CourseLocationPills course={course} />
      <CourseTeeCard courseId={course.id} />

      <div style={{ margin: '20px 0' }}><Divider /></div>

      {/* ══ BLOCK 2 — HOW IT PLAYS (one dataset, one header, three depths) ══ */}
      <SectionHeader role="section" kicker={t('courseDetail.blocks.howItPlays')} paddingX={16} />
      {/* Chart + Beast / Best Chance callouts, anchored together */}
      <CourseHolesTab courseId={course.id} section="shape" showTeeCard={false} showGhost={false} />
      {/* Detail — hole by hole, collapsed. Status branches deferred to the mount above. */}
      <CourseHolesTab
        courseId={course.id}
        section="holes"
        showTeeCard={false}
        showGhost={false}
        showEmptyState={false}
        suppressStatus
        collapsible
        defaultCollapsed
        onExpand={handleHolesExpand}
      />

      <div style={{ margin: '20px 0' }}><Divider /></div>

      {/* ══ BLOCK 3 — WHO PLAYS HERE (the people) ══ */}
      <SectionHeader role="section" kicker={t('courseDetail.blocks.whoPlaysHere')} paddingX={16} />

      <CourseRecordBook
        courseId={course.id}
        courseName={course.name}
        courseRegion={course.region ?? null}
        courseCountry={course.country ?? null}
        courseType={(course as { course_type?: string | null }).course_type ?? null}
        initialCategory={legendCategoryParam}
        onSeeAll={() => onTabChange?.('legends')}
        hideHeader
      />

      <div style={{ padding: '20px 16px 0' }}>
        <CommunityScoreCard
          courseId={course.id}
          courseName={course.name}
          ratingAggregates={ratingAggregates}
          userRating={userRating}
          distribution={distribution}
          onRateClick={handleRateClick}
          onSeeAllReviews={() => onTabChange?.('reviews')}
        />
        {userRating && (
          <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleRateClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: INK_FAINT,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              <Pencil className="h-3 w-3" />
              {t('courseDetail.about.editRating')}
            </button>
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />
      <CourseFriendsStrip courseId={course.id} courseName={course.name} />

      <div style={{ margin: '20px 0' }}><Divider /></div>

      {/* ══ BLOCK 4 — ABOUT THIS PLACE (everything that is not analytics) ══ */}
      <SectionHeader role="section" kicker={t('courseDetail.blocks.aboutThisPlace')} paddingX={16} />

      {course.description && (
        <div
          style={{
            margin: '0 16px',
            background: '#FFFFFF',
            border: `1px solid ${HAIRLINE_INK_7}`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          {/* Amber quote-mark motif */}
          <div
            style={{
              width: 28, height: 28, borderRadius: 9,
              background: 'rgba(247,147,30,0.10)', color: AMBER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Quote size={14} fill="currentColor" strokeWidth={0} />
          </div>
          {/* Prose - fade matches the white card bg */}
          <div style={{ fontSize: 14, color: SLATE_600, lineHeight: 1.7, position: 'relative' }}>
            {formatDescription(displayDescription)}
            {!showFullDescription && shouldShowReadMore && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to top, #FFFFFF, transparent)', pointerEvents: 'none' }} />
            )}
          </div>
          {/* Footer rail - amber ghost pill */}
          {shouldShowReadMore && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${HAIRLINE_INK_7}` }}>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                style={{
                  background: 'rgba(247,147,30,0.10)',
                  border: 'none', borderRadius: 999,
                  padding: '7px 14px',
                  fontSize: 12, fontWeight: 700, color: AMBER,
                  cursor: 'pointer',
                }}
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top 100 spotlight + summary */}
      {course.id && (
        <div style={{ marginTop: 20 }}>
          <div style={{ margin: '0 16px' }}>
            <CourseTop100Spotlight courseId={course.id} courseName={course.name} />
          </div>
          <CourseTop100Summary />
        </div>
      )}

      {/* Location */}
      <section style={{ marginTop: 20 }}>
        <div style={{ padding: '0 16px' }}>
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
            <p style={{ fontSize: 13, color: INK_FAINT }}>{t('courseDetail.about.locationUnavailable')}</p>
          )}
        </div>
      </section>

      <div style={{ height: 20 }} />
      <NearbySection lat={coords?.lat ?? course.latitude} lng={coords?.lng ?? course.longitude} />

      {/* Claim course - tri-state: unclaimed / pending / claimed */}
      {course.club_id && claimStatus && (
        <div style={{ marginTop: 20 }}>
          {claimStatus.state === 'unclaimed' && (
            <ClaimCourseCTA
              clubId={course.club_id}
              clubName={course.name}
              sourceCourseId={course.id}
            />
          )}
          {claimStatus.state === 'pending' && <ClaimUnderReviewNotice />}
          {claimStatus.state === 'claimed' && claimStatus.business && (
            <ClaimedCourseProfileLink business={claimStatus.business} />
          )}
        </div>
      )}

      {/* Media strip - renders its own heading internally */}
      <section style={{ marginTop: 20 }}>
        <AboutMediaStrip clubId={course.id} onSeeAllClick={() => onTabChange?.('media')} />
      </section>

      {/* Explore more - renders its own heading internally */}
      <div style={{ marginTop: 20 }}>
        <CourseExploreLinks course={course} />
      </div>

      {/* Official website - amber ghost button */}
      {course.website_url && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={handleWebsiteClick}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 14, background: 'rgba(247,147,30,0.06)', border: '1.5px solid rgba(247,147,30,0.2)', fontSize: 13, fontWeight: 700, color: AMBER, cursor: 'pointer' }}
          >
            <ExternalLink className="h-4 w-4" />
            {t('courseDetail.about.officialWebsite')}
          </button>
        </div>
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