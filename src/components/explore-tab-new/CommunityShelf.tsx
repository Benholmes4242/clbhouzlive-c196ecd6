import { ExploreSectionHeader } from './ExploreSectionHeader';
import { BucketListStrip } from './BucketListStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';

export function CommunityShelf({ activeRegion }: { activeRegion: string | null }) {
  return (
    <section>
      <ExploreSectionHeader
        kicker="Your community"
        title="Saved & loved"
        sub="Your bucket list and the month's top reviews"
      />
      {activeRegion === null && <BucketListStrip embedded />}
      <ReviewsOfTheWeekStrip embedded activeRegion={activeRegion} />
    </section>
  );
}
