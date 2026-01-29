import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AboutMediaStrip from './AboutMediaStrip';
import { useCourseCoordinates } from '@/hooks/useCourseCoordinates';
import { LocationMapCard } from '@/components/map';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CourseLocationBreadcrumb from './CourseLocationBreadcrumb';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { CourseTop100Summary } from './CourseTop100Summary';
import { formatCourseLocation } from '@/utils/courseLocation';
import { CourseTop100Spotlight } from './CourseTop100Spotlight';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';

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
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch coordinates (with geocoding fallback)
  const { coords, loading: coordsLoading } = useCourseCoordinates({
    courseId: course.id,
    latitude: course.latitude,
    longitude: course.longitude,
    name: course.name,
    country: course.country,
    subCountry: course.sub_country,
    region: course.region,
  });

  // Fetch rating aggregates using the new hook
  const { data: ratingAggregates } = useCourseRatingAggregates(course.id);
  
  // Fetch user's rating if logged in
  const { data: userRating } = useUserCourseRating(course.id, user?.id);

  const handleWebsiteClick = () => {
    if (course.website_url) {
      setShowWebsiteSheet(true);
    }
  };

  // Truncate description for preview
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
      toast({
        title: "Sign in required",
        description: "Please sign in to rate courses",
      });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${course.id}/rate`);
  };

  return (
    <div className="animate-in fade-in duration-200">
      {/* 1. About Section - Course description first */}
      {course.description && (
        <section className="pt-6 pb-6 bg-slate-50 space-y-4 md:pt-8">
          <div className="px-5 flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">About</h2>
          </div>
          <div className="px-5 relative">
            <div 
              className={`text-base md:text-lg leading-relaxed text-gray-700 ${
                !showFullDescription && shouldShowReadMore ? 'relative' : ''
              }`}
            >
              {formatDescription(displayDescription)}
              {/* Fade gradient overlay when collapsed */}
              {!showFullDescription && shouldShowReadMore && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
              )}
            </div>
            {/* Read more/Show less affordance */}
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="flex items-center gap-1.5 mt-3 text-base font-medium text-slate-600 hover:text-slate-900 active:opacity-70 transition-colors"
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
        </section>
      )}

      {/* 2. Top 100 Spotlight (only shows if course is in any Top 100 list) */}
      {course.id && (
        <section className="px-4 pt-5 pb-5 bg-slate-50 md:px-6">
          <CourseTop100Spotlight
            courseId={course.id}
            courseName={course.name}
          />
        </section>
      )}

      {/* 3. Top 100 mini-journey summary */}
      <CourseTop100Summary />

      {/* 4. Location Section */}
      <section className="pt-6 pb-5 bg-slate-100 md:pt-8">
        <div className="px-5 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Location</h2>
        </div>
        
        {/* Map card - unified with Business profile */}
        {coordsLoading && (
          <div className="px-5 md:px-4">
            <div className="w-full h-[200px] bg-surface-alt animate-pulse rounded-sq-md border border-slate-200" />
          </div>
        )}

        {coords && (
          <div className="px-5 md:px-4">
            <LocationMapCard
              lat={coords.lat}
              lng={coords.lng}
              name={course.name}
              locationText={formatCourseLocation(course)}
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

      {/* 5. Media Section */}
      <section className="pt-6 pb-5 bg-slate-50 space-y-3 md:pt-8">
        <AboutMediaStrip 
          clubId={course.id} 
          onSeeAllClick={() => onTabChange?.('media')}
        />
      </section>

      {/* 6. Rate CTA for users who haven't rated yet */}
      {user && !userRating && ratingAggregates && ratingAggregates.review_count > 0 && (
        <section className="px-4 pt-5 pb-5 bg-slate-100 md:pt-6">
          <h3 className="text-lg font-semibold mb-1">How do you rate this course?</h3>
          <p className="text-base text-slate-500 mb-3">
            Add your rating to see how it compares with the clbhouz community.
          </p>
          <Button onClick={handleRateClick} className="w-full bg-[#F8FAFC] text-slate-700 border-0 hover:bg-slate-200" variant="outline">
            Rate this course
          </Button>
        </section>
      )}

      {/* 7. Explore More - Location breadcrumb & quick filters (moved to bottom as exit points) */}
      <CourseLocationBreadcrumb course={course} />

      {/* 8. Visit Website */}
      {course.website_url && (
        <section className="px-4 pt-6 pb-3 bg-slate-100 md:pt-8">
          <Button
            onClick={handleWebsiteClick}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-[#F8FAFC] text-slate-700 border-0 hover:bg-slate-200"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4" />
            Official course website
          </Button>
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
