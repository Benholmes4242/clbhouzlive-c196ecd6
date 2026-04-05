import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MdOutlineStarOutline } from 'react-icons/md';
import { supabase } from '@/integrations/supabase/client';

interface TrendingCourse {
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  global_rank: number | null;
  review_count: number;
  post_count: number;
  trending_score: number;
}

interface TrendingCoursesStripProps {
  activeRegion?: string | null;
}

function TrendingCoursesStripInner({ activeRegion }: TrendingCoursesStripProps) {
  const navigate = useNavigate();

  const { data: courses } = useQuery({
    queryKey: ['trending-courses', activeRegion],
    queryFn: async (): Promise<TrendingCourse[]> => {
      const params: Record<string, any> = { p_days_back: 30, p_limit: 15 };
      if (activeRegion) params.p_region_slug = activeRegion;

      const { data, error } = await supabase.rpc('get_trending_courses', params);
      if (error) {
        if (import.meta.env.DEV) console.error('[TrendingCourses] RPC error:', error);
        return [];
      }
      return (data ?? []) as TrendingCourse[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (!courses || courses.length < 3) return null;

  return (
    <div className="py-4" style={{ gridColumn: '1 / -1' }}>
      <div className="flex items-center px-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Trending Courses</h3>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {courses.map((course) => (
          <button
            key={course.course_id}
            type="button"
            onClick={() => navigate(`/courses/${course.course_id}`)}
            className="shrink-0 w-[154px] flex flex-col rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm text-left focus:outline-none"
          >
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.course_name}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover block shrink-0"
              />
            ) : (
              <div className="aspect-[4/3] w-full bg-muted shrink-0" />
            )}
            <div className="p-2 flex-1">
              <p className="text-[12px] font-semibold text-foreground line-clamp-1">
                {course.course_name}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {course.sub_country || course.country}
              </p>
              {course.review_count > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 mt-0.5">
                  <MdOutlineStarOutline className="w-3 h-3" />
                  {course.review_count} {course.review_count === 1 ? 'review' : 'reviews'}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const TrendingCoursesStrip = memo(TrendingCoursesStripInner);
