import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Earth } from 'lucide-react';
import { IoMdArrowBack } from 'react-icons/io';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryFlag from '@/components/ui/country-flag';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CourseAboutTab from '@/components/courses/course-detail/CourseAboutTab';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseMediaTab from '@/components/courses/course-detail/CourseMediaTab';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';


interface GolfClubViewProps {
  courseId: string;
  isInModal?: boolean;
  onClose?: () => void;
}

const GolfClubView: React.FC<GolfClubViewProps> = ({ courseId, isInModal = false, onClose }) => {
  const { user } = useSupabaseSession();
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



  if (courseLoading || !course) {
    // Phase 1 Perf: Use consistent skeleton loader
    return <CourseDetailSkeleton />;
  }

  return (
    <div className={isInModal ? "w-full" : "min-h-screen bg-muted/60 pb-20 w-full"}>
      {/* Extended Hero Banner - continues behind tabs */}
      <div className="course-hero-container relative overflow-hidden">
        {/* Back button for modal - positioned over hero image */}
        {isInModal && onClose && (
          <button
            onClick={onClose}
            className="glass-dark absolute top-3 left-3 md:top-4 md:left-4 z-20 rounded-xl p-2 flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="Go back"
          >
            <IoMdArrowBack className="h-5 w-5 text-white" />
          </button>
        )}
        
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
          className="course-hero-image w-full h-full object-cover !rounded-bl-none"
          style={{ height: 'calc(100% + 48px)' }} // Extend 48px to go behind tab bar
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
        <div className="absolute bottom-16 left-6 text-white z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-1.5 drop-shadow-2xl">{course.name}</h1>
          <p className="text-lg md:text-xl opacity-90 mb-2.5 drop-shadow-lg">
            {[course.country, course.sub_country, course.region].filter(Boolean).join(', ')}
          </p>
          
          {/* Top 100 Pills */}
          {(course.global_rank || course.regional_rank || course.usa_rank) && (
            <CourseRankBadges 
              globalRank={course.global_rank ?? null}
              regionalRank={course.regional_rank ?? null}
              usaRank={course.usa_rank ?? null}
              country={course.country}
              positioning="inline"
            />
          )}
        </div>

        {/* Tab Navigation - overlaid on hero */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-black/28 backdrop-blur-[22px] border-t border-white/6 rounded-none shadow-[0_8px_30px_rgba(0,0,0,0.45),0_0_1px_rgba(255,255,255,0.16)]">
              <TabsTrigger value="about" className="text-base text-white data-[state=active]:bg-white/16 data-[state=active]:backdrop-blur-[18px] data-[state=active]:border data-[state=active]:border-white/45 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,0,0,0.35)]">About</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base text-white data-[state=active]:bg-white/16 data-[state=active]:backdrop-blur-[18px] data-[state=active]:border data-[state=active]:border-white/45 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,0,0,0.35)]">Reviews</TabsTrigger>
              <TabsTrigger value="media" className="text-base text-white data-[state=active]:bg-white/16 data-[state=active]:backdrop-blur-[18px] data-[state=active]:border data-[state=active]:border-white/45 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(0,0,0,0.35)]">Media</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="course-hero-wrapper px-4 pt-4 space-y-4 md:px-6 md:pt-6">{/* No separate tab navigation needed - it's now overlaid on hero */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="about" className="mt-0">
            <CourseAboutTab course={course} onTabChange={setActiveTab} />
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-0">
            <CourseReviewsTab courseId={course.id} courseName={course.name} />
          </TabsContent>
          
          <TabsContent value="media" className="mt-0">
            <CourseMediaTab courseId={course.id} />
          </TabsContent>
          
        </Tabs>
      </div>

    </div>
  );
};

export default GolfClubView;