import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseReviews, ReviewsSortBy, ReviewsRatingFilter } from '@/hooks/useCourseReviews';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const CourseReviewsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [ratingFilter, setRatingFilter] = useState<ReviewsRatingFilter>('all');

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region, thumbnail_image')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: aggregates } = useCourseRatingAggregates(courseId);
  const { data: reviews, isLoading: reviewsLoading } = useCourseReviews(
    courseId,
    sortBy,
    ratingFilter
  );

  const avg = aggregates?.avg_overall_score ?? null;
  const count = aggregates?.review_count ?? 0;

  const handleRateCourseClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/courses/${courseId}/rate`);
  };

  const handleMarkHelpful = async (reviewId: string, currentCount: number | null) => {
    const queryKey = ['course-reviews-full', courseId, sortBy, ratingFilter];

    // Take a snapshot for rollback
    const previous = queryClient.getQueryData<any>(queryKey);

    const optimisticCount = (currentCount ?? 0) + 1;

    // Optimistic update in cache
    queryClient.setQueryData<any>(queryKey, (old: any) => {
      if (!old) return old;
      return old.map((r: any) =>
        r.id === reviewId ? { ...r, helpful_count: optimisticCount } : r
      );
    });

    // Persist to Supabase
    const { error } = await supabase
      .from('course_ratings' as any)
      .update({ helpful_count: optimisticCount })
      .eq('id', reviewId);

    if (error) {
      console.error('Error marking review helpful', error);
      // Roll back on error
      queryClient.setQueryData(queryKey, previous);
    } else {
      // Light cache refresh
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
    }
  };

  const formatLocation = () => {
    if (!course) return '';
    const parts = [course.sub_country, course.region, course.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-foreground">
      {/* Hero image with overlay */}
      <div className="relative h-[200px] w-full">
        <img
          src={course?.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop'}
          alt={course?.name || 'Golf course'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(`/courses/${courseId}`)}
          className="absolute top-4 left-4 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {/* Course name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">
            {courseLoading ? 'Loading...' : course?.name ?? 'Golf Course'}
          </h1>
          {formatLocation() && (
            <p className="text-sm text-white/80 mt-0.5 drop-shadow">
              {formatLocation()}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4">

        {/* Summary & rate button */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-slate/80">
              <Star className="h-4 w-4 fill-white text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {avg !== null ? avg.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                Based on {count} rating{count === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {user && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleRateCourseClick}
            >
              Rate this course
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {/* Rating filter pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(['all', '10-9', '8-7', '6-5', '<5'] as ReviewsRatingFilter[]).map((value) => {
              const labelMap: Record<ReviewsRatingFilter, string> = {
                all: 'All ratings',
                '10-9': '10–9',
                '8-7': '8–7',
                '6-5': '6–5',
                '<5': '< 5',
              };
              const active = ratingFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatingFilter(value)}
                  className={
                    'rounded-full px-3 py-1 transition-colors ' +
                    (active
                      ? 'bg-surface-slate text-white'
                      : 'bg-card/70 text-muted-foreground hover:bg-card')
                  }
                >
                  {labelMap[value]}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="text-xs text-muted-foreground">
            Sort by:{' '}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReviewsSortBy)}
              className="rounded-full border border-border bg-card/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-border/70"
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
              <option value="helpful">Most liked</option>
            </select>
          </div>
        </div>

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : reviews && reviews.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 px-4 py-6 text-center text-sm text-muted-foreground">
            No reviews yet for this filter.
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {reviews?.map((r) => {
              const name =
                r.user_profiles?.display_name ||
                r.user_profiles?.username ||
                'Golfer';
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    {/* Reviewer */}
                    <button
                      type="button"
                      onClick={() =>
                        r.user_profiles?.username &&
                        navigate(`/profile/${r.user_profiles.username}`)
                      }
                      className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-slate/80 text-[11px] font-medium text-white">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{name}</span>
                        {r.review_date && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(r.review_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Overall rating */}
                    {r.rating !== null && (
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {r.rating.toFixed(1)}
                        </div>
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-slate-100"
                            style={{ width: `${(r.rating / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review text */}
                  {r.review && (
                    <p className="text-xs leading-relaxed text-foreground/90 mb-2 whitespace-pre-wrap">
                      {r.review}
                    </p>
                  )}

                  {/* Breakdown row */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {r.design_score !== null && (
                      <span>Design {r.design_score.toFixed(1)}</span>
                    )}
                    {r.condition_score !== null && (
                      <span>Condition {r.condition_score.toFixed(1)}</span>
                    )}
                    {r.clubhouse_score !== null && (
                      <span>Clubhouse {r.clubhouse_score.toFixed(1)}</span>
                    )}
                    {r.facilities_score !== null && (
                      <span>Facilities {r.facilities_score.toFixed(1)}</span>
                    )}
                  </div>

                  {/* Helpful button and count */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleMarkHelpful(r.id, r.helpful_count)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Helpful
                    </button>

                    <div className="text-[11px] text-muted-foreground">
                      {(r.helpful_count ?? 0) > 0
                        ? `${r.helpful_count} golfer${(r.helpful_count ?? 0) === 1 ? '' : 's'} found this helpful`
                        : 'Be the first to mark this review helpful'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseReviewsPage;
