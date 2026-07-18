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
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseRatingDistribution } from '@/hooks/useCourseRatingDistribution';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { CourseFriendsStrip } from '@/components/golf-club/CourseFriendsStrip';
import CourseLocationPills from './CourseLocationPills';
import CourseExploreLinks from './CourseExploreLinks';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { CourseTop100Summary } from './CourseTop100Summary';
import { formatCourseLocation } from '@/utils/courseLocation';
import CommunityScoreCard from './CommunityScoreCard';
import { ConnectHandicapCue } from './ConnectHandicapCue';
import { CourseTop100Spotlight } from './CourseTop100Spotlight';
import { PersonalSection } from '@/components/courses/phase5';
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
  
  
  const navigate = useNavigate();
  const { data: courseClaim } = useCourseClaim(course.id);
  const { data: claimStatus } = useCourseClaimStatus(course.id);

  const { coords, loading: coordsLoading } = useCourseCoordinates({
    courseId: course.id,
    clubId: (course as any).club_id ?? null,
    latitude: course.latitude,
    longitude: course.longitude,
    name: course.name,
    country: course.country,
    subCountry: course.sub_country,
    region: course.region,
  });

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
      {/* 1. Location breadcrumb pills */}
      <CourseLocationPills course={course} />

      {/* 2. Community Rating — CommunityScoreCard renders its own header internally, no SectionLabel */}
      <div style={{ padding: '16px 16px 0' }}>
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
        <ConnectHandicapCue variant="about" courseName={course.name} />
      </div>


      <div style={{ margin: '16px 0' }}><Divider /></div>

      {/* 3. Your Journey — PersonalSection renders its own canonical SectionLabel internally */}
      {user && (
        <>
          <section>
            <PersonalSection courseId={course.id} courseName={course.name} />
          </section>
          <div style={{ margin: '16px 0' }}><Divider /></div>
        </>
      )}

      {/* 4. Friends Who've Played */}
      <CourseFriendsStrip courseId={course.id} courseName={course.name} />

      {/* 5. About - quiet notes card */}
      {course.description && (
        <>
          <div style={{ marginTop: 24 }}>
            <SectionHeader role="section" kicker="ABOUT" paddingX={16} />
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
              {/* Prose - same type, fade now matches the WHITE card bg */}
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
          </div>
          <div style={{ margin: '16px 0' }}><Divider /></div>
        </>
      )}

      {/* 6. Top 100 Spotlight — CourseTop100Spotlight renders its own header internally, no SectionLabel */}
      {course.id && (
        <>
          <div style={{ margin: '0 16px' }}>
            <CourseTop100Spotlight courseId={course.id} courseName={course.name} />
          </div>
          <CourseTop100Summary />
          <div style={{ margin: '16px 0' }}><Divider /></div>
        </>
      )}


      {/* 8. Location */}
      <section>
        <SectionHeader role="section" kicker="LOCATION" paddingX={16} />
        <div style={{ padding: '0 16px' }}>
          {coordsLoading && <Skeleton className="w-full h-[180px] rounded-xl" />}
          {coords && (
            <LocationMapCard
              lat={coords.lat}
              lng={coords.lng}
              name={course.name}
              locationText={formatCourseLocation(course)}
              colorful
            />
          )}
          {!coords && !coordsLoading && (
            <p style={{ fontSize: 13, color: INK_FAINT }}>{t('courseDetail.about.locationUnavailable')}</p>
          )}
        </div>
      </section>

      <div style={{ margin: '16px 0' }}><Divider /></div>

      {/* 8b. Nearby hospitality */}
      <NearbySection lat={coords?.lat ?? course.latitude} lng={coords?.lng ?? course.longitude} />


      {/* 9. Claim Course — tri-state: unclaimed / pending / claimed */}
      {course.club_id && claimStatus && (
        <>
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
          <div style={{ margin: '16px 0' }}><Divider /></div>
        </>
      )}

      {/* 10. Media — AboutMediaStrip renders its own "Media" heading internally, no SectionLabel */}
      <section>
        <AboutMediaStrip clubId={course.id} onSeeAllClick={() => onTabChange?.('media')} />
      </section>

      <div style={{ margin: '16px 0' }}><Divider /></div>

      {/* 11. Explore More — CourseExploreLinks renders its own heading internally, no SectionLabel */}
      <CourseExploreLinks course={course} />

      {/* 12. Official Website — amber ghost button, part of the explore section */}
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