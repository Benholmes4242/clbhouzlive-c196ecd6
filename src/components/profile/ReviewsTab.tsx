import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import ClubhouseLogo from "@/components/ui/clubhouse-logo";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import ReviewMediaThumb from './ReviewMediaThumb';
import { MediaItem } from '@/types/media';
import { ExploreContentItem } from '@/components/explore/types';
import { getStreamPoster } from '@/utils/stream';
import { FLAGS } from '@/config/flags';
import { useMediaViewer } from '@/hooks/useMediaViewer';

type Review = {
  id: string;
  user: { name: string; avatarUrl: string };
  rating10: number;            // 0–10
  dateISO: string;             // e.g. "2025-07-03"
  text: string;
  helpfulCount: number;
  unhelpfulCount?: number;
  userVote?: 'helpful' | 'unhelpful' | 'none';
  isYourReview?: boolean;
  media?: MediaItem[];         // Updated to use MediaItem type
};

type ReviewsTabProps = {
  averageRating10: number;     // e.g. 8.3
  totalReviews: number;        // e.g. 124
  sentimentLabel?: string;     // e.g. "Very Positive"
  reviews: Review[];
  onThumbClick?: (reviewIndex: number, mediaIndex: number) => void;
  courseId?: string;           // For query invalidation after voting
};

export default function ReviewsTab({
  averageRating10,
  totalReviews,
  sentimentLabel = sentimentFromAvg(averageRating10),
  reviews,
  courseId,
}: ReviewsTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <SummaryBar
        averageRating10={averageRating10}
        totalReviews={totalReviews}
        sentimentLabel={sentimentLabel}
      />

      {/* Optional: Sort/Filter row */}
      {/* <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Most Recent</Button>
        <Button variant="ghost" size="sm">Top Rated</Button>
      </div> */}

      <div className="space-y-4 md:space-y-5">
        {reviews
          .sort((a, b) => +new Date(b.dateISO) - +new Date(a.dateISO))
          .map((r) => (
            <ReviewCard key={r.id} review={r} courseId={courseId} />
          ))}
      </div>
    </div>
  );
}

/* ---------- Summary Bar ---------- */

function SummaryBar({
  averageRating10,
  totalReviews,
  sentimentLabel,
}: {
  averageRating10: number;
  totalReviews: number;
  sentimentLabel: string;
}) {
  const avgText = formatScore(averageRating10);
  return (
    <Card className="rounded-xl border bg-background">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
          <div className="flex items-baseline gap-3">
            <div className="text-3xl md:text-4xl font-semibold tabular-nums">
              {avgText}/10
            </div>
            <div className="text-lg md:text-xl font-semibold">{sentimentLabel}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            {toLocale(totalReviews)} {totalReviews === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Review Card ---------- */

function ReviewCard({ 
  review, 
  courseId
}: { 
  review: Review; 
  courseId?: string;
}) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [helpful, setHelpful] = React.useState(review.helpfulCount);
  const [unhelpful, setUnhelpful] = React.useState(review.unhelpfulCount || 0);
  const [userVote, setUserVote] = React.useState<'helpful' | 'unhelpful' | 'none'>(review.userVote || 'none');
  const [pending, setPending] = React.useState(false);

  const { openViewer } = useMediaViewer();

  const MAX_THUMBS = 3;

  const openModal = (index: number) => {
    if (review.media && review.media.length > 0) {
      // Transform review media to explore content items for unified player
      const mediaItems = review.media.map((m, i) => ({
        id: `${review.id}-media-${i}`,
        type: m.type as 'video' | 'image',
        src: m.url,
        title: review.text?.slice(0, 50) || 'Review media',
        likes: 0,
        user: {
          id: review.id,
          name: review.user.name,
          avatar: review.user.avatarUrl,
        },
      }));
      openViewer(mediaItems, index);
    }
  };

  // Vote handling logic
  const sendVote = async (nextVote: 'helpful' | 'unhelpful' | 'none') => {
    if (!user) {
      // TODO: Open auth modal - for now just return
      console.log('User not authenticated, should open login modal');
      return;
    }

    setPending(true);
    const prev = { userVote, helpful, unhelpful };

    // Optimistic update
    const applyVote = (from: typeof userVote, to: typeof userVote) => {
      let h = helpful, u = unhelpful;
      if (from === 'helpful') h--;
      if (from === 'unhelpful') u--;
      if (to === 'helpful') h++;
      if (to === 'unhelpful') u++;
      setHelpful(h);
      setUnhelpful(u);
      setUserVote(to);
    };

    applyVote(userVote, nextVote);

    try {
      const response = await fetch(`https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/review-vote/${review.id}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          value: nextVote === 'none' ? 'none' : nextVote 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Trust server response
      setHelpful(data.helpfulCount);
      setUnhelpful(data.unhelpfulCount);
      setUserVote(data.userVote);

      // Invalidate queries to refresh counts everywhere
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course-reviews-detailed', courseId] });
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Rollback on failure
      setHelpful(prev.helpful);
      setUnhelpful(prev.unhelpful);
      setUserVote(prev.userVote);
    } finally {
      setPending(false);
    }
  };

  const onHelpful = () => {
    if (pending) return;
    sendVote(userVote === 'helpful' ? 'none' : 'helpful');
  };

  const onUnhelpful = () => {
    if (pending) return;
    sendVote(userVote === 'unhelpful' ? 'none' : 'unhelpful');
  };

  return (
    <Card className="rounded-xl border bg-background shadow-sm">
      <CardContent className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SquircleAvatar 
              size={48} 
              src={review.user.avatarUrl}
              alt={`${review.user.name} avatar`}
              fallback={getInitials(review.user.name)}
            />
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium">{review.user.name}</span>
                <RatingPill value10={review.rating10} your={review.isYourReview} />
              </div>
            </div>
          </div>

          <time
            className="shrink-0 text-sm text-muted-foreground"
            dateTime={review.dateISO}
          >
            {formatDate(review.dateISO)}
          </time>
        </div>

        {/* Body */}
        <ReviewText text={review.text} />

        {/* Media Strip */}
        {review.media && review.media.length > 0 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {review.media.slice(0, MAX_THUMBS).map((mediaItem, mediaIndex) => (
              <ReviewMediaThumb
                key={mediaItem.id}
                item={mediaItem}
                onClick={() => openModal(mediaIndex)}
              />
            ))}

            {/* +X more tile */}
            {review.media.length > MAX_THUMBS && (
              <button
                onClick={() => openModal(MAX_THUMBS)}
                className="relative h-28 w-24 shrink-0 rounded-xl border border-border bg-muted/50 text-muted-foreground hover:bg-muted/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Open ${review.media.length - MAX_THUMBS} more items`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    +{review.media.length - MAX_THUMBS}
                  </span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-md border px-2 py-1 flex items-center gap-1 transition-colors",
              userVote === 'helpful' && "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
            )}
            aria-pressed={userVote === 'helpful'}
            disabled={pending}
            onClick={onHelpful}
          >
            <span aria-hidden className="text-base">👍</span>
            <span>Helpful</span>
            <span className="tabular-nums">({helpful})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-md border px-2 py-1 flex items-center gap-1 transition-colors",
              userVote === 'unhelpful' && "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
            )}
            aria-pressed={userVote === 'unhelpful'}
            disabled={pending}
            onClick={onUnhelpful}
          >
            <span aria-hidden className="text-base">👎</span>
            <span>Unhelpful</span>
            <span className="tabular-nums">({unhelpful})</span>
          </Button>

          {/* Future: comments + overflow menu */}
          {/* <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
            <span aria-hidden className="text-base mr-1">💬</span> Comment
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto h-8 w-8 p-0 text-muted-foreground">
            ⋮
          </Button> */}
        </div>
      </CardContent>

    </Card>
  );
}

/* ---------- Subcomponents & Utils ---------- */

function RatingPill({ value10, your }: { value10: number; your?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums",
        "bg-[#f59e0b]/10 text-[#d97706] dark:bg-[#f59e0b]/20 dark:text-[#fbbf24]"
      )}
      aria-label={`Rating ${formatScore(value10)} out of 10`}
    >
      <ClubhouseLogo size="xs" />
      {formatScore(value10)}
      {your && (
        <span className="rounded-full px-1.5 py-[1px] text-meta bg-white/70 text-[#d97706] dark:bg-white/10 dark:text-[#fbbf24]">
          Your Review
        </span>
      )}
    </span>
  );
}

function formatScore(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function sentimentFromAvg(avg: number) {
  if (avg >= 8.5) return "Exceptional";
  if (avg >= 8.0) return "Very Positive";
  if (avg >= 7.0) return "Positive";
  if (avg >= 6.0) return "Mixed";
  return "Needs Improvement";
}

function needsClamp(text: string) {
  // More accurate check: count words and estimated lines
  // Rough estimate: ~12-15 words per line on average
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount > 50; // Approximately 4 lines worth of text
}

function toLocale(n: number) {
  return n.toLocaleString();
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ---------- Review Text Component ---------- */

function ReviewText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  
  // Check if text needs truncation
  const needsTruncation = needsClamp(text);

  return (
    <div className="mt-3 text-base leading-relaxed">
      <p className={expanded ? "" : "line-clamp-4"}>
        {text}
      </p>
      
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-foreground hover:underline underline-offset-4 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* ---------- Mock usage (safe to remove when wired) ---------- */

// Example usage within your Profile Modal Router Reviews tab:
// <ReviewsTab
//   averageRating10={8.3}
//   totalReviews={124}
//   reviews={[
//     {
//       id: "r1",
//       user: { name: "Thomas Holmes", avatarUrl: "/avatars/thomas.jpg" },
//       rating10: 9.9,
//       dateISO: "2025-07-03",
//       text:
//         "I have played this multiple times now and am impressed every time. Course is immaculate!",
//       helpfulCount: 8,
//     },
//     {
//       id: "r2",
//       user: { name: "Benjamin Holmes", avatarUrl: "/avatars/ben.jpg" },
//       rating10: 8,
//       dateISO: "2025-06-25",
//       text:
//         "Really good courses, always in amazing condition. Exactly what you'd expect from a top-end resort course. Great clubhouse for a beer after.",
//       helpfulCount: 6,
//       isYourReview: true,
//     },
//   ]}
// />