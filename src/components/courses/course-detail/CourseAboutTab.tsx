import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import AboutMediaStrip from './AboutMediaStrip';

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
    courseDesign: 8.5,
    courseCondition: 8.8,
    facilities: 7.2
  };

  const getScorePercentage = (score: number) => (score / 10) * 100;

  return (
    <div className="space-y-6">
      {/* Community Score Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Community Score</h3>
          <div className="flex items-center gap-2">
            <ClubhouseLogo size="lg" />
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-bold">
                {ratingStats?.average_rating || 0}/10
              </div>
              <div className="text-sm text-muted-foreground text-center">
                {ratingStats?.total_ratings || 0} {ratingStats?.total_ratings === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course Design</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.courseDesign)}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course Condition</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.courseCondition)}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Facilities</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${getScorePercentage(communityScores.facilities)}%` }}
              />
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
          <div className="space-y-3">
            {course.region && (
              <div>
                <div className="text-sm text-muted-foreground">Region</div>
                <div className="font-medium">{course.region}</div>
              </div>
            )}
            {course.sub_country && (
              <div>
                <div className="text-sm text-muted-foreground">Country</div>
                <div className="font-medium">{course.sub_country}</div>
              </div>
            )}
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

      {/* Visit Website Button */}
      {course.website_url && (
        <div className={`${isMobile ? 'fixed bottom-4 left-4 right-4 z-50' : 'mt-6'}`}>
          <Button
            onClick={handleWebsiteClick}
            className={`w-full flex items-center justify-center gap-2 ${
              isMobile 
                ? 'bg-muted hover:bg-muted/80 text-foreground border' 
                : 'bg-muted hover:bg-muted/80 text-foreground border'
            }`}
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