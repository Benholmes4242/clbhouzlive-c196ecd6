import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourseClaim } from '@/hooks/useCourseClaim';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AboutMediaStrip from './AboutMediaStrip';
import { useCourseCoordinates } from '@/hooks/useCourseCoordinates';
import { LocationMapCard } from '@/components/map';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseRatingDistribution } from '@/hooks/useCourseRatingDistribution';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CourseFriendsStrip } from '@/components/golf-club/CourseFriendsStrip';
import CourseLocationPills from './CourseLocationPills';
import CourseExploreLinks from './CourseExploreLinks';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { CourseTop100Summary } from './CourseTop100Summary';
import { formatCourseLocation } from '@/utils/courseLocation';
import CommunityScoreCard from './CommunityScoreCard';
import { CourseTop100Spotlight } from './CourseTop100Spotlight';
import { PersonalSection } from '@/components/courses/phase5';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import { useBusinessClaimForCourse } from '@/hooks/useBusinessClaimForCourse';
import SuggestEditModal from './SuggestEditModal';
import ClaimCourseCTA from './ClaimCourseCTA';

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

const CourseAboutTab = ({ course, onTabChange }: CourseAboutTabProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showWebsiteSheet, setShowWebsiteSheet] = useState(false);
  const [showSuggestEdit, setShowSuggestEdit] = useState(false);
  const { user } = useSupabaseSession();
  
  const navigate = useNavigate();
  const { data: businessClaim } = useBusinessClaimForCourse(course.id);
  const { data: courseClaim } = useCourseClaim(course.id);

  const { coords, loading: coordsLoading } = useCourseCoordinates({
    courseId: course.id,
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
    <div className="animate-in fade-in duration-200">
      {/* 1. Location Pills */}
      <CourseLocationPills course={course} />

      {/* 2. Community Rating Section */}
      <section className="px-4 py-5 md:px-6 space-y-5">
        <CommunityScoreCard
          courseId={course.id}
          courseName={course.name}
          ratingAggregates={ratingAggregates}
          userRating={userRating}
          distribution={distribution}
          onRateClick={handleRateClick}
          onSeeAllReviews={() => onTabChange?.('reviews')}
        />

        {/* Edit/Rate button */}
        {userRating && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={handleRateClick}
              style={{ width: '100%', padding: '11px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(15,23,42,0.12)', fontSize: 13, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
            >
              ✏ Edit Your Rating
            </button>
          </div>
        )}

      </section>

      {/* 3. Your Journey Section */}
      {user && (
        <section style={{ marginTop: 12 }}>
          <PersonalSection courseId={course.id} courseName={course.name} />
        </section>
      )}

      {/* 4. Friends Who've Played */}
      <section className="px-4 pt-4 pb-4 md:px-6" style={{ marginTop: 12 }}>
        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
      </section>

      {/* 5. About Section */}
      {course.description && (
        <section className="pt-8 pb-6 space-y-4 md:pt-10" style={{ marginTop: 12 }}>
          <div className="px-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>About</span>
            </div>
          </div>
          <div className="px-5 relative">
            <div 
              className={`text-base md:text-lg leading-relaxed text-muted-foreground ${
                !showFullDescription && shouldShowReadMore ? 'relative' : ''
              }`}
            >
              {formatDescription(displayDescription)}
              {!showFullDescription && shouldShowReadMore && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              )}
            </div>
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="flex items-center gap-1.5 mt-3 min-h-[44px] text-base font-medium text-muted-foreground active:scale-[0.98] active:opacity-70 transition-all"
              >
                <span>{showFullDescription ? 'Show less' : 'Read more'}</span>
                {showFullDescription ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {/* Suggest an edit - only for verified business members */}
          {businessClaim?.isVerified && (
            <button
              type="button"
              onClick={() => setShowSuggestEdit(true)}
              className="flex items-center gap-1 mt-2 text-xs text-muted-foreground active:opacity-70 transition-opacity min-h-[44px]"
            >
              <Pencil className="h-3 w-3" />
              Suggest an edit
            </button>
          )}
        </section>
      )}

      {/* Suggest Edit Modal */}
      {businessClaim?.isVerified && (
        <SuggestEditModal
          open={showSuggestEdit}
          onClose={() => setShowSuggestEdit(false)}
          courseId={course.id}
          businessId={businessClaim.businessId}
          currentData={{
            description: course.description,
            website_url: course.website_url,
          }}
        />
      )}

      {/* 6. Top 100 Spotlight */}
      {course.id && (
        <section className="px-4 pt-5 pb-5 md:px-6" style={{ marginTop: 12 }}>
          <CourseTop100Spotlight
            courseId={course.id}
            courseName={course.name}
          />
        </section>
      )}

      {/* 7. Top 100 mini-journey summary */}
      <CourseTop100Summary />

      {/* 8. Location Section */}
      <section className="pt-6 pb-5 md:pt-8" style={{ marginTop: 12 }}>
        <div className="px-5 mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Location</span>
          </div>
        </div>
        
        {coordsLoading && (
          <div className="px-4">
            <Skeleton className="w-full h-[200px] rounded-sq-md" />
          </div>
        )}

        {coords && (
          <div className="px-4">
            <LocationMapCard
              lat={coords.lat}
              lng={coords.lng}
              name={course.name}
              locationText={formatCourseLocation(course)}
              colorful
            />
          </div>
        )}

        {!coords && !coordsLoading && (
          <div className="px-5">
            <p className="text-base text-muted-foreground">
              Location data isn't available for this course yet.
            </p>
          </div>
        )}
      </section>


      {/* Claim This Course CTA - only for unclaimed courses with a club_id */}
      {!courseClaim && course.club_id && (
        <div style={{ marginTop: 12 }}>
          <ClaimCourseCTA
            clubId={course.club_id}
            clubName={course.name}
          />
        </div>
      )}

      {/* 10. Media Section */}
      <section className="pt-6 pb-5 space-y-3 md:pt-8" style={{ marginTop: 12 }}>
        <AboutMediaStrip 
          clubId={course.id} 
          onSeeAllClick={() => onTabChange?.('media')}
        />
      </section>

      {/* 11. Explore More Links */}
      <div style={{ marginTop: 12 }}>
        <CourseExploreLinks course={course} />
      </div>

      {/* 12. Visit Website */}
      {course.website_url && (
        <section className="px-4 pt-2 pb-4 flex justify-center">
          <button
            onClick={handleWebsiteClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', fontSize: 13, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
          >
            <ExternalLink className="h-4 w-4" />
            Official course website
          </button>
        </section>
      )}

      {/* External Website Sheet */}
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