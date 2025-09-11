import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import ClubhouseLogo from "@/components/ui/clubhouse-logo";

type Review = {
  id: string;
  user: { name: string; avatarUrl: string };
  rating10: number;            // 0–10
  dateISO: string;             // e.g. "2025-07-03"
  text: string;
  helpfulCount: number;
  isYourReview?: boolean;
};

type ReviewsTabProps = {
  averageRating10: number;     // e.g. 8.3
  totalReviews: number;        // e.g. 124
  sentimentLabel?: string;     // e.g. "Very Positive"
  reviews: Review[];
};

export default function ReviewsTab({
  averageRating10,
  totalReviews,
  sentimentLabel = sentimentFromAvg(averageRating10),
  reviews,
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
            <ReviewCard key={r.id} review={r} />
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
            Based on {toLocale(totalReviews)} reviews
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Review Card ---------- */

function ReviewCard({ review }: { review: Review }) {
  const [helpful, setHelpful] = React.useState(review.helpfulCount);
  const [unhelpful, setUnhelpful] = React.useState(0);
  const [clamped, setClamped] = React.useState(true);

  return (
    <Card className="rounded-xl border bg-background shadow-sm">
      <CardContent className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <OptimizedAvatar
              src={review.user.avatarUrl}
              alt={`${review.user.name} avatar`}
              size={40}
              className="h-10 w-10 rounded-full object-cover"
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
        <div className="mt-3 text-base leading-relaxed">
          <p className={clamped ? "line-clamp-3" : ""}>{review.text}</p>
          {needsClamp(review.text) && (
            <button
              className="mt-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              onClick={() => setClamped((v) => !v)}
            >
              {clamped ? "Read more" : "Show less"}
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md border px-2 py-1 flex items-center gap-1"
            aria-pressed="false"
            onClick={() => setHelpful((n) => n + 1)} // TODO: wire to API
          >
            <span aria-hidden className="text-base">👍</span>
            <span>Helpful</span>
            <span className="tabular-nums">({helpful})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md border px-2 py-1 flex items-center gap-1"
            aria-pressed="false"
            onClick={() => setUnhelpful((n) => n + 1)} // TODO: wire to API
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
      className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-900 tabular-nums dark:bg-yellow-900/20 dark:text-yellow-100"
      aria-label={`Rating ${formatScore(value10)} out of 10`}
    >
      <ClubhouseLogo size="xs" />
      {formatScore(value10)}/10
      {your && (
        <span className="rounded-full bg-white/70 px-1.5 py-[1px] text-[11px] text-yellow-900 dark:bg-white/10 dark:text-yellow-100">
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
  return text && text.length > 180;
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