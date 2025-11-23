import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import AboutMediaStrip from './AboutMediaStrip';
import { useCourseCoordinates } from '@/hooks/useCourseCoordinates';
import CourseMapPreview from '@/components/courses/CourseMapPreview';
import CourseMapFullScreen from '@/components/courses/CourseMapFullScreen';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { Progress } from '@/components/ui/progress';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CourseFriendsStrip } from '@/components/golf-club/CourseFriendsStrip';
import CourseLocationBreadcrumb from './CourseLocationBreadcrumb';
import RatingComparisonCard from './RatingComparisonCard';
import CourseTop100Summary from './CourseTop100Summary';

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
  const [mapOpen, setMapOpen] = useState(false);
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
      window.open(course.website_url, '_blank');
    }
  };

  // Truncate description for preview
  const truncateDescription = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const shouldShowReadMore = course.description && course.description.split(' ').length > 50;
  const displayDescription = course.description && !showFullDescription && shouldShowReadMore
    ? truncateDescription(course.description, 50)
    : course.description;

  const getScorePercentage = (score: number) => (score / 10) * 100;
  
  const formatScore = (score: number) => {
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

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
    <div className="space-y-6">
      {/* Location Breadcrumb & Quick Filters */}
      <CourseLocationBreadcrumb course={course} />
      
      {/* Community Score Section */}
      <section className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <p className="text-heading-md font-semibold leading-snug">Community Score</p>
            <p className="text-body-sm text-muted-foreground">
              {ratingAggregates?.review_count === 1
                ? 'Based on 1 rating'
                : `Based on ${ratingAggregates?.review_count || 0} ratings`}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-card/60 px-2.5 py-1 text-xs font-semibold text-foreground">
            <ClubhouseLogo size="sm" className="h-3.5 w-3.5" />
            <span>
              {ratingAggregates?.avg_overall_score 
                ? formatScore(ratingAggregates.avg_overall_score) 
                : '—'}/10
            </span>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="mt-4">
          <Button 
            onClick={handleRateClick}
            className="w-full justify-center bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"
          >
            {userRating ? 'Edit Your Rating' : 'Review & Mark as Played'}
          </Button>
        </div>

        {/* Friends Who've Played */}
        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
        
        {ratingAggregates && ratingAggregates.review_count > 0 ? (
          <div className="mt-4 border-t border-border/60 pt-4 space-y-4">
            {/* Course Design */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Course Design</span>
                {ratingAggregates.avg_design_score != null && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatScore(ratingAggregates.avg_design_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_design_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_design_score)} 
                  className="h-2.5 rounded-full"
                />
              ) : (
                <>
                  <div className="h-2.5 rounded-full bg-muted" />
                  <div className="mt-0.5 flex justify-end">
                    <span className="text-[11px] text-muted-foreground">Not yet rated</span>
                  </div>
                </>
              )}
            </div>

            {/* Course Condition */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Course Condition</span>
                {ratingAggregates.avg_condition_score != null && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatScore(ratingAggregates.avg_condition_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_condition_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_condition_score)} 
                  className="h-2.5 rounded-full"
                />
              ) : (
                <>
                  <div className="h-2.5 rounded-full bg-muted" />
                  <div className="mt-0.5 flex justify-end">
                    <span className="text-[11px] text-muted-foreground">Not yet rated</span>
                  </div>
                </>
              )}
            </div>

            {/* Clubhouse */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Clubhouse</span>
                {ratingAggregates.avg_clubhouse_score != null && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatScore(ratingAggregates.avg_clubhouse_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_clubhouse_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_clubhouse_score)} 
                  className="h-2.5 rounded-full"
                />
              ) : (
                <>
                  <div className="h-2.5 rounded-full bg-muted" />
                  <div className="mt-0.5 flex justify-end">
                    <span className="text-[11px] text-muted-foreground">Not yet rated</span>
                  </div>
                </>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Facilities</span>
                {ratingAggregates.avg_facilities_score != null && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatScore(ratingAggregates.avg_facilities_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_facilities_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_facilities_score)} 
                  className="h-2.5 rounded-full"
                />
              ) : (
                <>
                  <div className="h-2.5 rounded-full bg-muted" />
                  <div className="mt-0.5 flex justify-end">
                    <span className="text-[11px] text-muted-foreground">Not yet rated</span>
                  </div>
                </>
              )}
            </div>

            {/* See all reviews link */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/courses/${course.id}/reviews`)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-all duration-motion-fast ease-standard"
              >
                See all reviews
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs md:text-sm text-muted-foreground text-center">
            No ratings yet – be the first to rate this course!
          </p>
        )}
      </section>

      {/* Your Rating vs Community Comparison */}
      {user && userRating && ratingAggregates && (
        <div className="mt-6">
          <RatingComparisonCard userRating={userRating} aggregates={ratingAggregates} />
        </div>
      )}

      {/* About Section */}
      {course.description && (
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-3">
          <h2 className="text-base md:text-lg font-semibold">About</h2>
          <div className="text-sm md:text-base leading-relaxed text-foreground">
            {formatDescription(displayDescription)}
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="block mt-4 text-sm font-medium hover:underline"
                style={{ color: '#3A3F46' }}
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Top 100 mini-journey summary (replaces milestones) */}
      <CourseTop100Summary />

      {/* Location and Media sections - side by side on desktop, stacked on mobile */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Location Section */}
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-3">
          <h2 className="text-base md:text-lg font-semibold">Location</h2>
          <p className="text-sm md:text-base text-foreground">
            {[course.sub_country, course.region].filter(Boolean).join(', ')}
          </p>
          
          {/* Map preview */}
          {!coords && coordsLoading && (
            <div className="w-full h-44 sm:h-52 md:h-[200px] lg:h-[220px] rounded-2xl bg-surface-alt animate-pulse" />
          )}

          {coords && (
            <>
              <CourseMapPreview
                latitude={coords.lat}
                longitude={coords.lng}
                courseName={course.name}
                onOpenFullMap={() => setMapOpen(true)}
              />

              <CourseMapFullScreen
                open={mapOpen}
                onOpenChange={setMapOpen}
                latitude={coords.lat}
                longitude={coords.lng}
                courseName={course.name}
                country={course.country}
                subCountry={course.sub_country}
              />
            </>
          )}

          {!coords && !coordsLoading && (
            <p className="text-sm text-muted-foreground">
              Location data isn't available for this course yet.
            </p>
          )}
        </section>

        {/* Media Section */}
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-3">
          <AboutMediaStrip 
            clubId={course.id} 
            onSeeAllClick={() => onTabChange?.('media')}
          />
        </section>
      </div>

      {/* Mobile: Visit Website Button inline after Media section */}
      {course.website_url && (
        <div className="block md:hidden mt-6">
          <Button
            onClick={handleWebsiteClick}
            className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground border h-11 rounded-xl"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </Button>
        </div>
      )}

      {/* Desktop: Visit Website Button at bottom */}
      {course.website_url && (
        <div className="hidden md:block mt-6 mb-3">
          <Button
            onClick={handleWebsiteClick}
            className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground border"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseAboutTab;