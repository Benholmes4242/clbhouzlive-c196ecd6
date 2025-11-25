import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
import CourseTop100Summary from './CourseTop100Summary';
import { formatCourseLocation } from '@/utils/courseLocation';
import { CategoryScoreCard } from '@/components/ratings/CategoryScoreCard';
import { getRatingComparisonState } from '@/utils/ratingComparison';

const ArrowUp = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M10 3L4 9H8V17H12V9H16L10 3Z"
      fill="#3CC76A"
    />
  </svg>
);

const ArrowDown = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M10 17L16 11H12V3H8V11H4L10 17Z"
      fill="#E85151"
    />
  </svg>
);

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
    <div>
      {/* Location Breadcrumb & Quick Filters - now handles its own padding */}
      <CourseLocationBreadcrumb course={course} />
      
      {/* Community Score Section - Seamless with User Rating inline */}
      <section className="px-4 pt-6 pb-5 bg-slate-50 md:px-6 md:pt-8">
        {ratingAggregates && ratingAggregates.review_count > 0 ? (
          <>
            {/* Top hero card */}
            <div className="rounded-3xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    Community Score
                  </h3>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {ratingAggregates.review_count === 1
                      ? 'Based on 1 rating'
                      : `Based on ${ratingAggregates.review_count} ratings`}
                  </p>

                  {/* Only-you message or comparison line */}
                  {(() => {
                    const comparison = getRatingComparisonState(
                      ratingAggregates.review_count,
                      ratingAggregates.avg_overall_score ?? null,
                      userRating?.rating ?? null
                    );

                    const onlyUser = comparison?.type === 'only-user';

                    if (onlyUser) {
                      return (
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                          Only you have rated this course so far.
                        </p>
                      );
                    }

                    // Show comparison line if user has rated AND there are at least 2 ratings total
                    const showComparison =
                      userRating?.rating != null &&
                      ratingAggregates.review_count > 1 &&
                      ratingAggregates.avg_overall_score != null &&
                      comparison;

                    if (!showComparison) return null;

                    const diffOverall = (userRating?.rating ?? 0) - (ratingAggregates.avg_overall_score ?? 0);
                    const isOnPar = comparison.type === 'on-par';

                    return (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        {isOnPar ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : diffOverall < 0 ? (
                          <ArrowDown />
                        ) : (
                          <ArrowUp />
                        )}

                        <span className="text-slate-600">
                          {isOnPar
                            ? 'You rate this course on par with the community.'
                            : diffOverall < 0
                            ? `You rate this course ${Math.abs(diffOverall).toFixed(1)} ${Math.abs(diffOverall) === 1 ? 'point' : 'points'} lower than the community.`
                            : `You rate this course ${diffOverall.toFixed(1)} ${diffOverall === 1 ? 'point' : 'points'} higher than the community.`}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: ring + score */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10">
                    <ClubhouseLogo size="md" className="flex-shrink-0" />
                  </div>
                  <span className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {ratingAggregates.avg_overall_score != null
                      ? formatScore(ratingAggregates.avg_overall_score)
                      : '--'}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Category grid - only show if any breakdowns exist */}
            {(() => {
              const categories = [
                { label: 'Course Design', user: userRating?.design_score ?? null, community: ratingAggregates.avg_design_score ?? null },
                { label: 'Course Condition', user: userRating?.condition_score ?? null, community: ratingAggregates.avg_condition_score ?? null },
                { label: 'Clubhouse', user: userRating?.clubhouse_score ?? null, community: ratingAggregates.avg_clubhouse_score ?? null },
                { label: 'Facilities', user: userRating?.facilities_score ?? null, community: ratingAggregates.avg_facilities_score ?? null },
              ];

              const hasAnyBreakdown = categories.some(cat => cat.user != null || cat.community != null);

              if (!hasAnyBreakdown) return null;

              return (
                <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2 sm:gap-4">
                  {categories.map(cat => {
                    // Hide individual card if both are null
                    if (cat.user == null && cat.community == null) return null;
                    
                    return (
                      <CategoryScoreCard
                        key={cat.label}
                        label={cat.label}
                        user={cat.user}
                        community={cat.community}
                      />
                    );
                  })}
                </div>
              );
            })()}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => onTabChange?.('reviews')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-all duration-motion-fast ease-standard"
              >
                See all reviews
              </button>
            </div>

            {/* Edit Rating button - only show if user has rated */}
            {userRating && (
              <Button 
                onClick={handleRateClick}
                className="w-full justify-center mt-4"
                variant="outline"
              >
                Edit Your Rating
              </Button>
            )}
          </>
        ) : (
          <>
            {/* No ratings yet state - Seamless */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Community Score</h3>
              <p className="text-base text-muted-foreground mb-4 text-center">
                No ratings yet – be the first to rate this course!
              </p>
              
              {/* Review button for empty state */}
              <Button 
                onClick={handleRateClick}
                className="w-full justify-center"
                variant="outline"
              >
                Rate this course
              </Button>
            </div>
          </>
        )}

        {/* Friends Who've Played */}
        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
      </section>

      {/* Your Rating vs Community Comparison - removed, now integrated into hero card */}

      {/* CTA for users who haven't rated yet */}
      {user && !userRating && ratingAggregates && ratingAggregates.review_count > 0 && (
        <section className="px-4 pt-6 pb-5 bg-slate-50 md:pt-8">
          <h3 className="text-lg font-semibold mb-1">How do you rate this course?</h3>
          <p className="text-base text-slate-500 mb-3">
            Add your rating to see how it compares with the clbhouz community.
          </p>
          <Button onClick={handleRateClick} className="w-full" variant="outline">
            Rate this course
          </Button>
        </section>
      )}

      {/* About Section - Seamless */}
      {course.description && (
        <section className="px-4 pt-6 pb-5 bg-slate-100 space-y-3 md:pt-8">
          <h2 className="text-lg md:text-xl font-semibold">About</h2>
          <div className="text-base md:text-lg leading-relaxed text-foreground">
            {formatDescription(displayDescription)}
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="block mt-4 text-base font-medium hover:underline text-slate-600"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Top 100 mini-journey summary (replaces milestones) */}
      <CourseTop100Summary />

      {/* Location Section - Seamless */}
      <section className="pt-6 pb-5 bg-slate-50 md:pt-8">
        <div className="px-4 space-y-3 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Location</h2>
          <p className="text-base md:text-lg text-foreground">
            {formatCourseLocation(course)}
          </p>
        </div>
        
        {/* Map preview - full bleed on mobile (0px gaps), with padding on desktop */}
        {!coords && coordsLoading && (
          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 sm:px-0 md:px-4">
            <div className="w-full h-[280px] sm:h-64 bg-surface-alt animate-pulse rounded-none sm:rounded-xl border border-border/60 sm:border-border/40" />
          </div>
        )}

        {coords && (
          <>
            <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 sm:px-0 md:px-4">
              <CourseMapPreview
                latitude={coords.lat}
                longitude={coords.lng}
                courseName={course.name}
                onOpenFullMap={() => setMapOpen(true)}
              />
            </div>

            <CourseMapFullScreen
              open={mapOpen}
              onOpenChange={setMapOpen}
              latitude={coords.lat}
              longitude={coords.lng}
              courseName={course.name}
              locationText={formatCourseLocation(course)}
            />
          </>
        )}

        {!coords && !coordsLoading && (
          <div className="px-4">
            <p className="text-base text-muted-foreground">
              Location data isn't available for this course yet.
            </p>
          </div>
        )}
      </section>

      {/* Media Section - Seamless */}
      <section className="pt-6 pb-5 bg-slate-100 space-y-3 md:pt-8">
        <AboutMediaStrip 
          clubId={course.id} 
          onSeeAllClick={() => onTabChange?.('media')}
        />
      </section>

      {/* Visit Website - Seamless section */}
      {course.website_url && (
        <section className="px-4 pt-6 pb-3 bg-slate-50 md:pt-8">
          <Button
            onClick={handleWebsiteClick}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </Button>
        </section>
      )}
    </div>
  );
};

export default CourseAboutTab;