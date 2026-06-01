import { Heart } from 'lucide-react';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import { BucketListStrip } from './BucketListStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';

export function CommunityShelf({ activeRegion }: { activeRegion: string | null }) {
  return (
    <section>
      <ExploreSectionHeader
        title="Saved & loved"
        icon={Heart}
        sub="Your bucket list and the month's top reviews"
      />
      {activeRegion === null && <BucketListStrip embedded label="Your bucket list" />}
      <ReviewsOfTheWeekStrip embedded label="Most loved this month" activeRegion={activeRegion} />
    </section>
  );
}
