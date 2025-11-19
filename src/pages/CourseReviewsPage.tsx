import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseReviews, ReviewsSortBy, ReviewsRatingFilter } from '@/hooks/useCourseReviews';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CourseReviewsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [ratingFilter, setRatingFilter] = useState<ReviewsRatingFilter>('all');

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region')
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
    // Trigger the existing rate course modal via custom event
    window.dispatchEvent(
      new CustomEvent('open-rate-course-modal', { detail: { courseId } })
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4">
        {/* Back + title */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="rounded-full bg-card/60 p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Course reviews
            </span>
            <span className="text-sm font-semibold">
              {courseLoading ? 'Loading course…' : course?.name ?? 'Golf course'}
            </span>
          </div>
        </div>

        {/* Summary & rate button */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-slate/80">
              <Star className="h-4 w-4 fill-white text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {avg !== null ? avg.toFixed(1) : '—'} / 10
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
                    <p className="text-xs leading-relaxed text-foreground/90 mb-2">
                      {r.review}
                    </p>
                  )}

                  {/* Breakdown row */}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {r.design_score !== null && (
                      <span>Design {r.design_score.toFixed(1)}/10</span>
                    )}
                    {r.condition_score !== null && (
                      <span>Condition {r.condition_score.toFixed(1)}/10</span>
                    )}
                    {r.clubhouse_score !== null && (
                      <span>Clubhouse {r.clubhouse_score.toFixed(1)}/10</span>
                    )}
                    {r.facilities_score !== null && (
                      <span>Facilities {r.facilities_score.toFixed(1)}/10</span>
                    )}
                  </div>

                  {/* Helpful metrics */}
                  {r.helpful_count !== null && r.helpful_count > 0 && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {r.helpful_count} golfer
                      {r.helpful_count === 1 ? '' : 's'} found this helpful
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReviewsPage;
