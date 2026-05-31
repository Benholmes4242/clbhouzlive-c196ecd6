import { ExploreSectionHeader } from './ExploreSectionHeader';
import { BucketListStrip } from './BucketListStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';

interface CommunityShelfProps {
  activeRegion: string | null;
}

/**
 * Phase 2b — merges BucketListStrip + ReviewsOfTheWeekStrip under
 * a single "Your community / Saved & loved" header so they read as
 * one community block instead of two stacked sections.
 *
 * BucketList stays region-gated (visible only on the global view).
 * ReviewsOfTheWeek keeps its own `< 2` self-hide guard.
 * When the global view is active we always have the bucket list rail
 * (empty-state included), so the header is not orphaned. Under a region
 * the header only renders alongside reviews; if reviews self-hide there,
 * we skip the header too.
 */
export function CommunityShelf({ activeRegion }: CommunityShelfProps) {
  const showBucket = activeRegion === null;

  // When region-filtered AND reviews would self-hide there is nothing to show.
  // We can't cheaply pre-check reviews without lifting the hook, so v1:
  // - global view: always render header (bucket list is reliably populated, even empty-state)
  // - region view: render header + reviews; if reviews self-hide we accept that
  //   the lone header is hidden by the surrounding empty content (no rail = no shelf)
  if (!showBucket) {
    // Region active: skip the whole block — reviews handle their own
    // empty state and we don't want an orphan header under a region.
    return <ReviewsOfTheWeekStrip embedded={false} activeRegion={activeRegion} />;
  }

  return (
    <div className="space-y-internal">
      <ExploreSectionHeader
        kicker="Your community"
        title="Saved & loved"
        sub="Your bucket list and the month's top reviews"
      />
      <BucketListStrip embedded />
      <ReviewsOfTheWeekStrip embedded activeRegion={activeRegion} />
    </div>
  );
}
