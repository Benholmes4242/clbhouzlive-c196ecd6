import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TrendingCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_image: string | null;
  global_rank: number | null;
}

function TrendingCoursesStripInner() {
  const navigate = useNavigate();

  const { data: courses } = useQuery({
    queryKey: ['explore-trending-courses'],
    queryFn: async (): Promise<TrendingCourse[]> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank')
        .not('thumbnail_image', 'is', null)
        .not('global_rank', 'is', null)
        .order('global_rank', { ascending: true })
        .limit(15);

      if (error) {
        console.error('[TrendingCourses] fetch error:', error);
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
      <div className="flex items-center justify-between px-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Trending Courses</h3>
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="text-xs text-muted-foreground"
        >
          See all →
        </button>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => navigate(`/course/${course.id}`)}
            className="shrink-0 w-[140px] rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm text-left focus:outline-none"
          >
            <img
              src={course.thumbnail_image!}
              alt={course.name}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-2">
              <p className="text-[12px] font-semibold text-foreground line-clamp-1">
                {course.name}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {course.sub_country || course.country}
              </p>
              {course.global_rank && (
                <p className="text-[10px] font-semibold text-amber-600 mt-0.5">
                  #{course.global_rank}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const TrendingCoursesStrip = memo(TrendingCoursesStripInner);
