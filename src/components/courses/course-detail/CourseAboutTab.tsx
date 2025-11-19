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
        currentFacilitiesScore={userRating?.facilities_score}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />
    <div className="space-y-6">
      {/* Location Breadcrumb & Quick Filters */}
      <CourseLocationBreadcrumb course={course} />
      
      {/* Community Score Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Community Score</h3>
            <div className="flex items-center gap-3">
              <ClubhouseLogo size="lg" />
              <div className="text-4xl font-bold">
                {ratingAggregates?.avg_overall_score 
                  ? formatScore(ratingAggregates.avg_overall_score) 
                  : '—'}<span className="text-2xl text-muted-foreground">/10</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              Based on {ratingAggregates?.review_count || 0} {ratingAggregates?.review_count === 1 ? 'rating' : 'ratings'}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleRateClick}
            className="flex-1"
          >
            {userRating ? 'Edit Your Rating' : 'Rate this Course'}
          </Button>
          <Button 
            onClick={handlePlayedToggle}
            disabled={isToggling}
            variant={hasPlayed ? "default" : "outline"}
            className={hasPlayed ? "flex-1" : "flex-1"}
          >
            {hasPlayed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                You've Played Here
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
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No ratings yet</p>
            <p className="text-xs mt-1">Be the first to rate this course!</p>
          </div>
        )}
      </div>

      {/* About Section */}
      {course.description && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <div className="text-muted-foreground leading-relaxed">
            {formatDescription(displayDescription)}
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="block mt-2 text-muted-foreground hover:text-foreground font-medium"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Milestones Card */}
      <CourseMilestonesCard courseId={course.id} />

      {/* Location and Media sections - side by side on desktop, stacked on mobile */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Location Section */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">Location</h3>
          
          {/* Row with Country left, Region right */}
          <div className="flex justify-between items-start mb-4">
            {course.sub_country && (
              <div>
                <div className="text-sm text-muted-foreground">Country</div>
                <div className="font-medium">{course.sub_country}</div>
              </div>
            )}
            {course.region && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Region</div>
                <div className="font-medium">{course.region}</div>
              </div>
            )}
          </div>

          {/* Map - full width below */}
          <div className="w-full">
            <MapThumbnail
              clubId={course.id}
              clubName={course.name}
              region={course.region}
              country={course.country}
              subCountry={course.sub_country}
              latitude={course.latitude}
              longitude={course.longitude}
              className="w-full h-44 sm:h-52 md:h-[200px] lg:h-[220px] rounded-lg"
              mapType="hybrid"
            />
          </div>
        </div>

        {/* Media Section */}
        <div className="bg-card rounded-lg border p-6">
          <AboutMediaStrip 
            clubId={course.id} 
            onSeeAllClick={() => onTabChange?.('media')}
          />
        </div>
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