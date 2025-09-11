import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import AboutMediaStrip from './AboutMediaStrip';
import MapThumbnail from '@/components/ui/map-thumbnail';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
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
  const isMobile = useIsMobile();

  // Fetch rating stats for community score
  const { data: ratingStats } = useQuery({
    queryKey: ['course-rating-stats', course.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating, review')
        .eq('course_id', course.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { average_rating: 0, total_ratings: 0 };
      }

      const totalRatings = data.length;
      const averageRating = data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;

      return {
        average_rating: Math.round(averageRating * 10) / 10,
        total_ratings: totalRatings
      };
    },
    enabled: !!course.id,
  });

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

  // Mock community score data - in real app this would come from rating breakdown
  const communityScores = {
    courseDesign: 8.4,
    courseCondition: 8.8,
    facilities: 7.7
  };

  const getScorePercentage = (score: number) => (score / 10) * 100;
  
  const formatScore = (score: number) => {
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Community Score Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Community Score</h3>
            <div className="flex items-center gap-2">
              <ClubhouseLogo size="lg" />
              <div className="text-3xl font-bold">
                {ratingStats?.average_rating || 0}/10
              </div>
            </div>
          </div>
          <div className="flex justify-end mr-3">
            <div className="text-sm text-muted-foreground text-center">
              {ratingStats?.total_ratings || 0} {ratingStats?.total_ratings === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course Design</span>
            </div>
            <div className="relative w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.courseDesign)}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                style={{ 
                  left: `${Math.min(getScorePercentage(communityScores.courseDesign), 85)}%`,
                  transform: 'translateY(-50%) translateX(-50%)'
                }}
              >
                {formatScore(communityScores.courseDesign)}/10
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course Condition</span>
            </div>
            <div className="relative w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.courseCondition)}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                style={{ 
                  left: `${Math.min(getScorePercentage(communityScores.courseCondition), 85)}%`,
                  transform: 'translateY(-50%) translateX(-50%)'
                }}
              >
                {formatScore(communityScores.courseCondition)}/10
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Facilities</span>
            </div>
            <div className="relative w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.facilities)}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                style={{ 
                  left: `${Math.min(getScorePercentage(communityScores.facilities), 85)}%`,
                  transform: 'translateY(-50%) translateX(-50%)'
                }}
              >
                {formatScore(communityScores.facilities)}/10
              </div>
            </div>
          </div>
        </div>
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
  );
};

export default CourseAboutTab;