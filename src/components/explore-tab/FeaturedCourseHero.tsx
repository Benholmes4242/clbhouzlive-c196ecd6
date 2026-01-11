/**
 * FeaturedCourseHero - Featured course hero section for Explore page
 * 
 * Displays a curated featured course with:
 * - Full-width course photography
 * - World/Top100 ranking badge
 * - Course name and location
 * - Social proof (moments, friends played)
 * - CTA button
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Trophy, Users, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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
  friends_played_count?: number;
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
      <div className={cn("relative mx-4", className)}>
        <div className="relative rounded-2xl overflow-hidden">
          <Skeleton className="w-full h-[280px]" />
        </div>
      </div>
    );
  }

  if (!course) {
    // Fallback to generic hero if no featured course
    return (
      <div className={cn("relative mx-4", className)}>
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <div className="relative h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  Discover
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-2xl font-bold text-white tracking-tight"
              >
                Where will you play next?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-2 text-sm text-white/70 font-light"
              >
                Discover places worth the journey.
              </motion.p>
              {onSearchClick && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  onClick={onSearchClick}
                  className="mt-5 self-start inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl transition-colors shadow-lg"
                >
                  <span>Start exploring</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const location = course.sub_country 
    ? `${course.sub_country}, ${course.country}`
    : course.country;

  return (
    <div className={cn("relative mx-4", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer"
        onClick={handleViewCourse}
      >
        {/* Course Image */}
        <div className="relative h-[280px]">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900" />
          )}
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
          
          {/* Ranking Badge - top left */}
          {course.global_rank && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute top-4 left-4"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm rounded-full shadow-lg">
                <Trophy className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white">
                  #{course.global_rank} World
                </span>
              </div>
            </motion.div>
          )}
          
          {/* Content - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
                {course.name}
              </h2>
              <p className="text-sm text-white/70 mb-3">
                {location}
              </p>
              
              {/* Social proof */}
              {course.moment_count && course.moment_count > 0 && (
                <div className="flex items-center gap-4 mb-4 text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-3 h-3" />
                    <span>{course.moment_count} moments</span>
                  </div>
                </div>
              )}
              
              {/* CTA */}
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl transition-colors shadow-lg group/btn"
              >
                <span>View Course</span>
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeaturedCourseHero;
