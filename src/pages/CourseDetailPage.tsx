import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ExternalLink, Target, Check, Earth } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryFlag from '@/components/ui/country-flag';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PostPlayRatingModal from '@/components/courses/PostPlayRatingModal';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTab from '@/components/courses/course-detail/CourseMediaTab';
import CourseLeaderboardTab from '@/components/courses/course-detail/CourseLeaderboardTab';
import FloatingCTA from '@/components/courses/course-detail/FloatingCTA';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

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

  const { data: userTop100Course } = useQuery({
    queryKey: ['user-top100-course', courseId, user?.id],
    queryFn: async () => {
      if (!user?.id || !courseId) return null;

      const { data, error } = await supabase
        .from('user_top100_courses')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(user?.id && courseId),
  });

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

  const handleAddToPlayed = () => {
    setShowRatingModal(true);
  };

  const handleWebsiteClick = () => {
    if (course?.website_url) {
      window.open(course.website_url, '_blank');
    }
  };

  const isAlreadyPlayed = userCourse?.played || userTop100Course?.played;

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop'}
          alt={course.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=600&fit=crop';
          }}
        />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 z-50"
          onClick={() => {
            console.log('Back button clicked');
            navigate('/courses');
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Bottom Left Overlay */}
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-lg mb-4 opacity-90">
            {[course.country, course.region, course.sub_country].filter(Boolean).join(', ')}
          </p>
          
          {/* Rankings underneath location text - Mobile Only */}
          <div className="md:hidden flex items-center gap-2 mb-4">
            {course.global_rank && (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-sm min-h-[44px]">
                <Earth className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white">#{course.global_rank}</span>
              </div>
            )}
            {((course.country === 'Britain & Ireland' || course.country === 'United Kingdom') && course.regional_rank) && (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-sm min-h-[44px]">
                <CountryFlag country="Britain & Ireland" size="sm" />
                <span className="text-sm font-bold text-white">#{course.regional_rank}</span>
              </div>
            )}
            {(course.country === 'USA' && course.usa_rank) && (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-sm min-h-[44px]">
                <CountryFlag country="USA" size="sm" />
                <span className="text-sm font-bold text-white">#{course.usa_rank}</span>
              </div>
            )}
            {(course.country === 'Continental Europe' && course.regional_rank) && (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-sm min-h-[44px]">
                <CountryFlag country="Continental Europe" size="sm" />
                <span className="text-sm font-bold text-white">#{course.regional_rank}</span>
              </div>
            )}
          </div>

          {/* Visit Website button - hidden on mobile, shown on desktop */}
          {course.website_url && (
            <Button
              variant="outline"
              className="hidden md:flex bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              onClick={handleWebsiteClick}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </Button>
          )}
        </div>

        {/* Bottom Right Overlay - Played Button */}
        {user && (
          <div className="absolute bottom-6 right-6">
            {!isAlreadyPlayed ? (
              <Button
                onClick={handleAddToPlayed}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-medium min-h-[44px]"
              >
                <Target className="h-5 w-5 mr-2" />
                Add to My Played
              </Button>
            ) : (
              <Button
                onClick={() => setShowRatingModal(true)}
                className="bg-green-600/80 hover:bg-green-700 text-white px-6 py-3 text-lg font-medium min-h-[44px]"
              >
                <Check className="h-5 w-5 mr-2" />
                Played
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Course Info Strip */}
      <div className="bg-card border-b p-4">
        <div className="max-w-6xl mx-auto">
          {/* Desktop Layout - Rankings left, Community Rating right */}
          <div className="hidden md:flex items-center justify-between">
            {/* Left side - Rankings on desktop */}
            <div className="flex items-center gap-4">
              {course.global_rank && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl shadow-sm">
                  <Earth className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-bold text-gray-800">#{course.global_rank}</span>
                </div>
              )}
              {((course.country === 'Britain & Ireland' || course.country === 'United Kingdom') && course.regional_rank) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl shadow-sm">
                  <CountryFlag country="Britain & Ireland" size="md" />
                  <span className="text-sm font-bold text-gray-800">#{course.regional_rank}</span>
                </div>
              )}
              {(course.country === 'USA' && course.usa_rank) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl shadow-sm">
                  <CountryFlag country="USA" size="md" />
                  <span className="text-sm font-bold text-gray-800">#{course.usa_rank}</span>
                </div>
              )}
              {(course.country === 'Continental Europe' && course.regional_rank) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl shadow-sm">
                  <CountryFlag country="Continental Europe" size="md" />
                  <span className="text-sm font-bold text-gray-800">#{course.regional_rank}</span>
                </div>
              )}
            </div>
            
            {/* Right side - Community Rating on desktop */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-xl font-semibold">
                {ratingStats?.average_rating || 0}/10
              </span>
              <span className="text-muted-foreground">
                ({ratingStats?.total_ratings || 0} votes)
              </span>
            </div>
          </div>

          {/* Mobile Layout - Community Rating left, Visit Website button right */}
          <div className="md:hidden flex items-center justify-between">
            {/* Left side - Community Rating on mobile */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-xl font-semibold">
                {ratingStats?.average_rating || 0}/10
              </span>
              <span className="text-muted-foreground text-base">
                ({ratingStats?.total_ratings || 0} votes)
              </span>
            </div>
            
            {/* Right side - Visit Website button on mobile */}
            {course.website_url && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] px-4"
                onClick={handleWebsiteClick}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto p-6">
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

      {/* Floating CTA on Mobile */}
      <FloatingCTA 
        isVisible={!isAlreadyPlayed && !!user}
        onAddToPlayed={handleAddToPlayed}
      />

      {/* Rating Modal */}
      <PostPlayRatingModal
        course={course}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        isEditMode={isAlreadyPlayed}
      />
    </div>
  );
};

export default CourseDetailPage;