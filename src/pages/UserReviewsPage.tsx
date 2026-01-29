import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublicProfileByUsername } from '@/hooks/usePublicProfileByUsername';
import { useUserCourseReviews } from '@/hooks/useUserCourseReviews';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSelect, AppSelectOption } from '@/components/ui/AppSelect';

const SORT_OPTIONS: AppSelectOption<'recent' | 'highest' | 'lowest' | 'helpful'>[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'highest', label: 'Highest rating' },
  { value: 'lowest', label: 'Lowest rating' },
  { value: 'helpful', label: 'Most liked' },
];

const UserReviewsPage: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');

  const { data: profile, isLoading: loadingProfile } = usePublicProfileByUsername(username);

  const userId = profile?.id;
  const { data: reviews = [], isLoading } = useUserCourseReviews({
    userId,
    limit: 100,
    sortBy,
  });

  const name = profile?.display_name || username || 'This golfer';

  const headerTitle = useMemo(
    () => `Reviews by ${name}`,
    [name]
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] px-4 py-3 pb-28">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{headerTitle}</h1>
          <p className="text-[11px] text-muted-foreground">
            Courses {name} has reviewed on Clbhouz.
          </p>
        </div>

        {/* Sort */}
        <AppSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as typeof sortBy)}
          options={SORT_OPTIONS}
          ariaLabel="Sort reviews"
          triggerClassName="h-8 rounded-full text-[11px]"
        />
      </div>

      {/* Loading */}
      {(isLoading || loadingProfile) && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* No reviews */}
      {!isLoading && !reviews.length && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {name} hasn't written any reviews yet.
        </p>
      )}

      {/* Reviews list */}
      <div className="mt-2 space-y-3">
        {reviews.map((r) => {
          const courseName = r.golf_courses?.name ?? 'Unknown course';
          const location =
            r.golf_courses?.sub_country ??
            r.golf_courses?.country ??
            r.golf_courses?.region ??
            null;
          const rating = r.rating ?? 0;
          const dateLabel = r.review_date
            ? new Date(r.review_date).toLocaleDateString()
            : '';

          return (
            <div
              key={r.id}
              className="rounded-2xl border border-border/60 bg-card/80 px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${r.course_id}`)}
                    className="text-xs font-semibold text-foreground hover:underline truncate"
                  >
                    {courseName}
                  </button>
                  {location && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {location}
                    </div>
                  )}
                  {dateLabel && (
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Reviewed on {dateLabel}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[11px] text-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{rating.toFixed(1)}</span>
                  </div>
                  {r.helpful_count && r.helpful_count > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>
                        {r.helpful_count} golfer
                        {r.helpful_count === 1 ? '' : 's'} found this helpful
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {r.review && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {r.review}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserReviewsPage;
