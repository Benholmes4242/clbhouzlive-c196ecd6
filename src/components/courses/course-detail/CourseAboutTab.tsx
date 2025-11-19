import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Check, Target } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import AboutMediaStrip from './AboutMediaStrip';
import MapThumbnail from '@/components/ui/map-thumbnail';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { Progress } from '@/components/ui/progress';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useUserPlayedCourse } from '@/hooks/useUserPlayedCourse';
import EditRatingModal from '@/components/courses/EditRatingModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CourseFriendsStrip } from '@/components/golf-club/CourseFriendsStrip';
import { CourseMilestonesCard } from '@/components/courses/CourseMilestonesCard';
import CourseLocationBreadcrumb from './CourseLocationBreadcrumb';
import RatingComparisonCard from './RatingComparisonCard';

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
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
};

const CourseAboutTab = ({ course, onTabChange }: CourseAboutTabProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch rating aggregates using the new hook
  const { data: ratingAggregates } = useCourseRatingAggregates(course.id);
  
  // Fetch user's rating if logged in
  const { data: userRating } = useUserCourseRating(course.id, user?.id);
  
  // Fetch and toggle played status
  const { hasPlayed, togglePlayed, isToggling } = useUserPlayedCourse(course.id, user?.id);

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
    setIsRatingModalOpen(true);
  };

  const handlePlayedToggle = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to track courses",
      });
      navigate('/auth');
      return;
    }
    togglePlayed({ played: !hasPlayed });
  };

  return (
    <>
      <EditRatingModal
        courseId={course.id}
        courseName={course.name}
        currentRating={userRating?.rating || 5}
        currentReview={userRating?.review || null}
        currentDesignScore={userRating?.design_score}
        currentConditionScore={userRating?.condition_score}
        currentClubhouseScore={userRating?.clubhouse_score}
        currentFacilitiesScore={userRating?.facilities_score}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />
    <div className="space-y-6">
      {/* Location Breadcrumb & Quick Filters */}
      <CourseLocationBreadcrumb course={course} />
      
      {/* Community Score Section */}
      <section className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">Community Score</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Based on {ratingAggregates?.review_count || 0} {ratingAggregates?.review_count === 1 ? 'rating' : 'ratings'}
            </p>
          </div>

          <div className="flex items-baseline gap-1">
            <ClubhouseLogo size="sm" />
            <span className="text-base md:text-lg font-semibold text-foreground">
              {ratingAggregates?.avg_overall_score 
                ? formatScore(ratingAggregates.avg_overall_score) 
                : '—'}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleRateClick}
            className="w-full sm:w-auto justify-center bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"
          >
            {userRating ? 'Edit Your Rating' : 'Rate this Course'}
          </Button>
          <Button 
            onClick={handlePlayedToggle}
            disabled={isToggling}
            variant="outline"
            className="w-full sm:w-auto justify-center border-border/70 bg-card"
          >
            {hasPlayed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark as Played
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Mark as Played
              </>
            )}
          </Button>
        </div>

        {/* Friends Who've Played */}
        <CourseFriendsStrip courseId={course.id} courseName={course.name} />
        
        {ratingAggregates && ratingAggregates.review_count > 0 ? (
          <div className="space-y-5">
            {/* Course Design */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Course Design</span>
                {ratingAggregates.avg_design_score && (
                  <span className="text-sm font-semibold">
                    {formatScore(ratingAggregates.avg_design_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_design_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_design_score)} 
                  className="h-2"
                />
              ) : (
                <div className="h-2 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Not yet rated</span>
                </div>
              )}
            </div>

            {/* Course Condition */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Course Condition</span>
                {ratingAggregates.avg_condition_score && (
                  <span className="text-sm font-semibold">
                    {formatScore(ratingAggregates.avg_condition_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_condition_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_condition_score)} 
                  className="h-2"
                />
              ) : (
                <div className="h-2 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Not yet rated</span>
                </div>
              )}
            </div>

            {/* Clubhouse */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Clubhouse</span>
                {ratingAggregates.avg_clubhouse_score && (
                  <span className="text-sm font-semibold">
                    {formatScore(ratingAggregates.avg_clubhouse_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_clubhouse_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_clubhouse_score)} 
                  className="h-2"
                />
              ) : (
                <div className="h-2 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Not yet rated</span>
                </div>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Facilities</span>
                {ratingAggregates.avg_facilities_score && (
                  <span className="text-sm font-semibold">
                    {formatScore(ratingAggregates.avg_facilities_score)}/10
                  </span>
                )}
              </div>
              {ratingAggregates.avg_facilities_score ? (
                <Progress 
                  value={getScorePercentage(ratingAggregates.avg_facilities_score)} 
                  className="h-2"
                />
              ) : (
                <div className="h-2 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Not yet rated</span>
                </div>
              )}
            </div>

            {/* See all reviews link */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/courses/${course.id}/reviews`)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
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
        <RatingComparisonCard userRating={userRating} aggregates={ratingAggregates} />
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
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Milestones Card */}
      <CourseMilestonesCard courseId={course.id} />

      {/* Location and Media sections - side by side on desktop, stacked on mobile */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Location Section */}
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-3">
          <h2 className="text-base md:text-lg font-semibold">Location</h2>
          <p className="text-sm md:text-base text-foreground">
            {[course.sub_country, course.region].filter(Boolean).join(', ')}
          </p>
          
          {/* Map - full width below */}
          <div className="mt-2 rounded-xl overflow-hidden border border-border/60">
            <MapThumbnail
              clubId={course.id}
              clubName={course.name}
              region={course.region}
              country={course.country}
              subCountry={course.sub_country}
              latitude={course.latitude}
              longitude={course.longitude}
              className="w-full h-44 sm:h-52 md:h-[200px] lg:h-[220px]"
              mapType="hybrid"
            />
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
        <div className="hidden md:block mt-6">
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
    </>
  );
};

export default CourseAboutTab;