import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface HallOfFameCourse {
  course_id: string;
  course_name: string;
  location: string;
  thumbnail_url: string | null;
  lifetime_plays: number;
  lifetime_avg_rating: number | null;
  season_wins: number;
  hall_of_fame_category: string;
}

export const CourseHallOfFame: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data } = useQuery({
    queryKey: ['course-hall-of-fame'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_hall_of_fame');
      if (error) throw error;
      
      const courses = data as HallOfFameCourse[];
      const mostPlayed = courses?.filter((c) => c.hall_of_fame_category === 'most_played') || [];
      const highestRated = courses?.filter((c) => c.hall_of_fame_category === 'highest_rated') || [];
      
      return { mostPlayed, highestRated };
    },
    staleTime: 5 * 60 * 1000,
  });

  const mostPlayed = data?.mostPlayed || [];
  const highestRated = data?.highestRated || [];

  if (mostPlayed.length === 0 && highestRated.length === 0) return null;

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="px-4 pt-6 mt-4 border-t border-slate-100">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-900">Hall of Fame</span>
          <span className="text-xs text-slate-500">Courses</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="pt-4 space-y-6">
          {/* Most Played */}
          {mostPlayed.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                Lifetime Most Played
              </h4>
              <div className="flex items-end justify-center gap-3">
                {mostPlayed.map((course, index) => (
                  <button
                    key={course.course_id}
                    onClick={() => handleCourseClick(course.course_id)}
                    className={cn(
                      'text-center',
                      index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'
                    )}
                  >
                    <div
                      className={cn(
                        'w-16 h-12 rounded-lg overflow-hidden mx-auto bg-slate-100',
                        index === 0 && 'ring-2 ring-amber-400'
                      )}
                    >
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.course_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-700 mt-1.5 line-clamp-2 max-w-[70px] mx-auto">
                      {course.course_name}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {course.lifetime_plays} plays
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Highest Rated */}
          {highestRated.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                Lifetime Highest Rated
              </h4>
              <div className="flex items-end justify-center gap-3">
                {highestRated.map((course, index) => (
                  <button
                    key={course.course_id}
                    onClick={() => handleCourseClick(course.course_id)}
                    className={cn(
                      'text-center',
                      index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'
                    )}
                  >
                    <div
                      className={cn(
                        'w-16 h-12 rounded-lg overflow-hidden mx-auto bg-slate-100',
                        index === 0 && 'ring-2 ring-amber-400'
                      )}
                    >
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.course_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-700 mt-1.5 line-clamp-2 max-w-[70px] mx-auto">
                      {course.course_name}
                    </p>
                    <p className="text-[9px] text-slate-500 flex items-center justify-center">
                      {course.lifetime_avg_rating?.toFixed(1)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
