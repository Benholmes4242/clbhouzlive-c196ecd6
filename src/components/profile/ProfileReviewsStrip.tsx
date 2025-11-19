import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseReviews } from '@/hooks/useUserCourseReviews';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  userId: string;
  username: string;
  displayName?: string | null;
};

const ProfileReviewsStrip: React.FC<Props> = ({ userId, username, displayName }) => {
  const navigate = useNavigate();
  const { data: reviews = [], isLoading } = useUserCourseReviews({
    userId,
    limit: 5,
    sortBy: 'recent',
  });

  const name = displayName || username || 'This golfer';

  if (isLoading) {
    return (
      <section className="mt-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-foreground">
            Latest reviews by {name}
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  // No reviews – show a very light touch block or nothing
  if (!reviews.length) {
    return (
      <section className="mt-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
        <div className="text-xs font-medium text-foreground">
          Latest reviews by {name}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {name} hasn't reviewed any courses yet.
        </p>
      </section>
    );
  }

  const handleSeeAll = () => {
    navigate(`/profile/${username}/reviews`);
  };

  return (
    <section className="mt-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-foreground">
          Latest reviews by {name}
        </div>
        <button
          type="button"
          onClick={handleSeeAll}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          See all reviews
        </button>
      </div>

      {/* List of compact review rows */}
      <div className="space-y-2">
        {reviews.map((r) => {
          const courseName = r.golf_courses?.name ?? 'Unknown course';
          const location =
            r.golf_courses?.sub_country ??
            r.golf_courses?.country ??
            r.golf_courses?.region ??
            null;
          const rating = r.rating ?? 0;

          // small snippet of review body
          const snippet =
            (r.review || '')
              .trim()
              .split(/\s+/)
              .slice(0, 18)
              .join(' ') + (r.review && r.review.split(/\s+/).length > 18 ? '…' : '');

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/courses/${r.course_id}`)}
              className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-left hover:bg-background/70 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-foreground">
                    {courseName}
                  </div>
                  {location && (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {location}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-foreground">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{rating.toFixed(1)}/10</span>
                </div>
              </div>

              {snippet && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {snippet}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileReviewsStrip;
