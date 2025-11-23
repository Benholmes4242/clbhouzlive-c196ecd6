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

  // TEMPORARILY DISABLED FOR TESTING
  // const { coords, loading: coordsLoading } = useCourseCoordinates({
  //   courseId: course.id,
  //   latitude: course.latitude,
  //   longitude: course.longitude,
  //   name: course.name,
  //   country: course.country,
  //   subCountry: course.sub_country,
  //   region: course.region,
  // });

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
        {ratingAggregates && ratingAggregates.review_count > 0 ? (
          <>
            {/* Header with premium score */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold">Community Score</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {ratingAggregates.review_count} {ratingAggregates.review_count === 1 ? 'rating' : 'ratings'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <ClubhouseLogo size="sm" className="h-5 w-5" />
                <span className="text-xl md:text-2xl font-semibold transition-opacity duration-300">
                  {formatScore(ratingAggregates.avg_overall_score || 0)}/10
                </span>
              </div>
            </div>

            {/* Category bars with animations */}
            <div className="space-y-3 mb-5">
              {/* Course Design */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Course Design</span>
                  <span className="text-xs text-muted-foreground">
                    {ratingAggregates.avg_design_score ? formatScore(ratingAggregates.avg_design_score) : '–'}/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                    style={{ width: ratingAggregates.avg_design_score ? `${(ratingAggregates.avg_design_score / 10) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Course Condition */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Course Condition</span>
                  <span className="text-xs text-muted-foreground">
                    {ratingAggregates.avg_condition_score ? formatScore(ratingAggregates.avg_condition_score) : '–'}/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                    style={{ width: ratingAggregates.avg_condition_score ? `${(ratingAggregates.avg_condition_score / 10) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Clubhouse */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Clubhouse</span>
                  <span className="text-xs text-muted-foreground">
                    {ratingAggregates.avg_clubhouse_score ? formatScore(ratingAggregates.avg_clubhouse_score) : '–'}/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                    style={{ width: ratingAggregates.avg_clubhouse_score ? `${(ratingAggregates.avg_clubhouse_score / 10) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Facilities</span>
                  <span className="text-xs text-muted-foreground">
                    {ratingAggregates.avg_facilities_score ? formatScore(ratingAggregates.avg_facilities_score) : '–'}/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                    style={{ width: ratingAggregates.avg_facilities_score ? `${(ratingAggregates.avg_facilities_score / 10) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* See all reviews link */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => onTabChange?.('reviews')}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-all duration-motion-fast ease-standard"
              >
                See all reviews
              </button>
            </div>

            {/* Edit Rating button - only show if user has rated */}
            {userRating && (
              <Button 
                onClick={handleRateClick}
                className="w-full justify-center bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"
              >
                Edit Your Rating
              </Button>
            )}
          </>
        ) : (
          <>
            {/* No ratings yet state */}
            <h3 className="text-base font-semibold mb-1">Community Score</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No ratings yet – be the first to rate this course!
            </p>
            
            {/* Review button for empty state */}
            <Button 
              onClick={handleRateClick}
              className="w-full justify-center bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"
            >
              Review & Mark as Played
            </Button>
          </>
        )}

        {/* Friends Who've Played */}
        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
      </section>

      {/* Your Overall Rating Section */}
      {user && userRating && ratingAggregates && ratingAggregates.review_count > 0 && (() => {
        const userOverall = userRating.rating;
        const communityOverall = ratingAggregates.avg_overall_score || 0;
        const delta = Number((userOverall - communityOverall).toFixed(1));

        return (
          <section className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Your Overall Rating
                </p>
                <p className="text-sm text-muted-foreground">
                  {delta === 0
                    ? 'You and the community are almost identical.'
                    : delta > 0
                    ? `You rate this course ${delta.toFixed(1)} ${delta === 1 ? 'point' : 'points'} higher than the community.`
                    : `You rate this course ${Math.abs(delta).toFixed(1)} ${Math.abs(delta) === 1 ? 'point' : 'points'} lower than the community.`}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">
                    {formatScore(userOverall)}/10
                  </span>
                  <span className="text-xs text-muted-foreground">Your rating</span>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Your Rating vs Community Comparison */}
      {user && userRating && ratingAggregates && ratingAggregates.review_count > 0 && (
        <RatingComparisonCard userRating={userRating} aggregates={ratingAggregates} />
      )}

      {/* CTA for users who haven't rated yet */}
      {user && !userRating && ratingAggregates && ratingAggregates.review_count > 0 && (
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-4">
          <h3 className="text-base font-semibold mb-1">How do you rate this course?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Add your rating to see how it compares with the clbhouz community.
          </p>
          <Button onClick={handleRateClick} className="w-full bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90">
            Review this course
          </Button>
        </section>
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
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Location Section */}
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-3">
          <h2 className="text-base md:text-lg font-semibold">Location</h2>
          <p className="text-sm md:text-base text-foreground">
            {[course.sub_country, course.country].filter(Boolean).join(', ')}
          </p>
          
          {/* MAPBOX TEMPORARILY DISABLED FOR TESTING */}
          <div className="w-full h-44 sm:h-52 md:h-[200px] lg:h-[220px] rounded-2xl bg-surface-alt flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Map temporarily disabled for testing</p>
          </div>
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
        <div className="hidden md:block mt-6 mb-6">
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