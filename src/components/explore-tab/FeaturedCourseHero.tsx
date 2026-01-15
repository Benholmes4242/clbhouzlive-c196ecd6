/**
 * FeaturedCourseHero - Featured course hero section for Explore page (Hub polished)
 * 
 * Displays a curated featured course with:
 * - Full-width course photography
 * - World/Top100 ranking badge (amber pill)
 * - Course name and location
 * - Social proof (moments count)
 * - CTA button
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Trophy, MapPin, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedCourseHeroProps {
  className?: string;
  onSearchClick?: () => void;
}

interface FeaturedCourse {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  global_rank: number | null;
  moment_count?: number;
}

/**
 * Hook to fetch a featured course
 * Uses top-ranked course with recent activity as featured
 */
function useFeaturedCourse() {
  return useQuery({
    queryKey: ['featured-course-hero'],
    queryFn: async (): Promise<FeaturedCourse | null> => {
      // Get top courses with activity in last 30 days
      const { data: activity } = await supabase
        .from('vw_course_activity_30d')
        .select('course_id, moments_7d, moments_30d')
        .order('moments_7d', { ascending: false })
        .limit(20);

      // Get courses with global ranking
      const { data: topCourses, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank')
        .not('global_rank', 'is', null)
        .not('thumbnail_image', 'is', null)
        .order('global_rank')
        .limit(10);

      if (error || !topCourses?.length) return null;

      // Pick course with best combo of rank and activity
      const courseActivity = activity || [];
      const scoredCourses = topCourses.map(course => {
        const act = courseActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          moment_count: act?.moments_30d || 0,
          score: (100 - (course.global_rank || 100)) + (act?.moments_7d || 0) * 2,
        };
      });

      scoredCourses.sort((a, b) => b.score - a.score);
      const featured = scoredCourses[0];

      return {
        id: featured.id,
        name: featured.name,
        country: featured.country,
        sub_country: featured.sub_country,
        thumbnail_image: featured.thumbnail_image,
        global_rank: featured.global_rank,
        moment_count: featured.moment_count,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export const FeaturedCourseHero: React.FC<FeaturedCourseHeroProps> = ({
  className,
  onSearchClick,
}) => {
  const navigate = useNavigate();
  const { data: course, isLoading } = useFeaturedCourse();

  const handleViewCourse = () => {
    if (course) {
      navigate(`/courses/${course.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("relative h-72 bg-[#e2e8f0] animate-pulse", className)}>
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <div className="h-4 w-16 bg-white/30 rounded" />
          <div className="h-6 w-48 bg-white/30 rounded" />
          <div className="h-4 w-32 bg-white/30 rounded" />
        </div>
      </div>
    );
  }

  if (!course) {
    // Fallback to generic hero if no featured course
    return (
      <div className={cn("relative w-full h-72 overflow-hidden", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-medium text-white uppercase tracking-wide mb-2">
            Discover
          </span>
          <h2 className="text-2xl font-bold text-white mb-1">
            Where will you play next?
          </h2>
          <p className="text-sm text-white/70 mb-4">
            Discover places worth the journey.
          </p>
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="inline-flex items-center px-5 py-2.5 bg-white text-[#1e293b] text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
            >
              Start Exploring
            </button>
          )}
        </div>
      </div>
    );
  }

  const location = course.sub_country 
    ? `${course.sub_country}, ${course.country}`
    : course.country;

  return (
    <button
      onClick={handleViewCourse}
      className={cn("relative w-full h-72 overflow-hidden group", className)}
    >
      {/* Background Image */}
      {course.thumbnail_image ? (
        <img
          src={course.thumbnail_image}
          alt={course.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Rank Badge - Top Left */}
      {course.global_rank && course.global_rank <= 100 && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-white" />
            <span className="text-sm font-bold text-white">#{course.global_rank} World</span>
          </div>
        </div>
      )}
      
      {/* Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* Featured Label */}
        <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-medium text-white uppercase tracking-wide mb-2">
          Featured Course
        </span>
        
        {/* Course Name */}
        <h2 className="text-2xl font-bold text-white mb-1 line-clamp-2">
          {course.name}
        </h2>
        
        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/80 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-sm">{location}</span>
        </div>

        {/* Social proof */}
        {course.moment_count && course.moment_count > 0 && (
          <div className="flex items-center gap-1.5 text-white/60 mb-4">
            <Play className="w-3 h-3" />
            <span className="text-xs">{course.moment_count} moments</span>
          </div>
        )}
        
        {/* CTA Button */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#1e293b] text-sm font-medium rounded-full hover:bg-white/90 transition-colors">
          <span>Explore Course</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};

export default FeaturedCourseHero;
