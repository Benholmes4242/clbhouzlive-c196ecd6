import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Earth } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryFlag from '@/components/ui/country-flag';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTab from '@/components/courses/course-detail/CourseMediaTab';
import CourseLeaderboardTab from '@/components/courses/course-detail/CourseLeaderboardTab';
import CoursePlayedButton from '@/components/courses/CoursePlayedButton';
import AddToPlayedModal from '@/components/courses/AddToPlayedModal';

interface GolfClubViewProps {
  courseId: string;
  isInModal?: boolean;
}

const GolfClubView: React.FC<GolfClubViewProps> = ({ courseId, isInModal = false }) => {
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('about');
  const [showAddToPlayedModal, setShowAddToPlayedModal] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Check if user has played this course
  const { data: userCourse } = useQuery({
    queryKey: ['user-course', courseId, user?.id],
    queryFn: async () => {
      if (!user?.id || !courseId) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(user?.id && courseId),
  });

  // Update played state when userCourse data changes
  React.useEffect(() => {
    setIsPlayed(!!userCourse?.played);
  }, [userCourse]);

  const { data: ratingStats } = useQuery({
    queryKey: ['course-rating-stats', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating, review')
        .eq('course_id', courseId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { average_rating: 0, total_ratings: 0, total_reviews: 0 };
      }

      const totalRatings = data.length;
      const averageRating = data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
      const totalReviews = data.filter(r => r.review && r.review.trim() !== '').length;

      return {
        average_rating: Math.round(averageRating * 10) / 10,
        total_ratings: totalRatings,
        total_reviews: totalReviews
      };
    },
    enabled: !!courseId,
  });

  const handleWebsiteClick = () => {
    if (course?.website_url) {
      window.open(course.website_url, '_blank');
    }
  };

  const handleAddToPlayed = () => {
    setShowAddToPlayedModal(true);
  };

  const handlePlayedSuccess = () => {
    setIsPlayed(true);
  };

  if (courseLoading || !course) {
    return (
      <div className={isInModal ? "p-6 space-y-4" : "min-h-screen bg-background"}>
        <div className="animate-pulse">
          <div className="h-96 bg-muted" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isInModal ? "w-full" : "min-h-screen bg-background pb-20 w-full"}>
      {/* Hero Banner */}
      <div className="course-hero-container relative overflow-hidden">
        <img
          src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop'}
          srcSet={course.thumbnail_image ? `
            ${course.thumbnail_image}?w=768&h=384&fit=crop 768w,
            ${course.thumbnail_image}?w=1200&h=600&fit=crop 1200w,
            ${course.thumbnail_image}?w=1920&h=960&fit=crop 1920w
          ` : `
            https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=768&h=384&fit=crop 768w,
            https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop 1200w,
            https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&h=960&fit=crop 1920w
          `}
          sizes="(max-width: 768px) 100vw, 1200px"
          alt={course.name}
          loading="eager"
          className="course-hero-image w-full h-full object-cover"
          onLoad={(e) => {
            e.currentTarget.classList.add('loaded');
          }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop';
            e.currentTarget.srcset = `
              https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=768&h=384&fit=crop 768w,
              https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop 1200w,
              https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&h=960&fit=crop 1920w
            `;
          }}
        />
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Course Title & Location - Bottom Left */}
        <div className="absolute bottom-6 left-6 text-white z-10">
          <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-lg opacity-90 mb-3">
            {[course.country, course.region, course.sub_country].filter(Boolean).join(', ')}
          </p>
          
          {/* Ranking badges */}
          <div className="flex gap-2 flex-wrap">
            {course.global_rank && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <Earth className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">#{course.global_rank}</span>
              </div>
            )}
            {((course.country === 'Britain & Ireland' || course.country === 'United Kingdom') && course.regional_rank) && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <CountryFlag country="Britain & Ireland" size="sm" />
                <span className="text-sm font-bold text-white">#{course.regional_rank}</span>
              </div>
            )}
            {(course.country === 'USA' && course.usa_rank) && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <CountryFlag country="USA" size="sm" />
                <span className="text-sm font-bold text-white">#{course.usa_rank}</span>
              </div>
            )}
            {(course.country === 'Continental Europe' && course.regional_rank) && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <CountryFlag country="Continental Europe" size="sm" />
                <span className="text-sm font-bold text-white">#{course.regional_rank}</span>
              </div>
            )}
          </div>
        </div>

        {/* Add to Played Button - Bottom Right */}
        {user && (
          <CoursePlayedButton 
            isPlayed={isPlayed}
            onAddToPlayed={handleAddToPlayed}
          />
        )}
      </div>

      {/* Rating and Website Section */}
      <div className="bg-background py-4">
        <div className="course-hero-wrapper">
          <div className="flex items-center justify-between w-full">
            {/* Community Vote Score - Left */}
            <div className="flex items-center gap-2">
              <ClubhouseLogo size="md" showTooltip />
              <span className="text-xl font-semibold text-foreground">
                {ratingStats?.average_rating || 0}/10
              </span>
              <span className="text-muted-foreground">
                ({ratingStats?.total_ratings || 0} votes)
              </span>
            </div>
            
            {/* Visit Website Button - Right */}
            {course.website_url && (
              <Button
                variant="outline"
                onClick={handleWebsiteClick}
                className="flex items-center gap-2 rounded-full px-4 py-2 ml-auto"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <div className={isInModal ? "bg-background border-b" : "sticky top-0 z-40 bg-background border-b"}>
        <div className="course-hero-wrapper">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="about" className="text-base">About</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base">Reviews</TabsTrigger>
              <TabsTrigger value="media" className="text-base">Media</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-base">Leaderboard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="course-hero-wrapper p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="about" className="mt-0">
            <CourseAboutTab course={course} />
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-0">
            <CourseReviewsTab courseId={course.id} courseName={course.name} />
          </TabsContent>
          
          <TabsContent value="media" className="mt-0">
            <CourseMediaTab courseId={course.id} />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-0">
            <CourseLeaderboardTab courseId={course.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add to Played Modal */}
      <AddToPlayedModal
        course={course}
        isOpen={showAddToPlayedModal}
        onClose={() => setShowAddToPlayedModal(false)}
        onSuccess={handlePlayedSuccess}
      />
    </div>
  );
};

export default GolfClubView;