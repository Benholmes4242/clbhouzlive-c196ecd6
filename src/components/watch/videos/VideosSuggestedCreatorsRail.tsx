import { memo } from 'react';
import { useSuggestedCreators } from '@/components/watch/hooks/useSuggestedCreators';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { SuggestedCreatorCard } from '@/components/shared/SuggestedCreatorCard';

interface VideosSuggestedCreatorsRailProps {
  userId: string | undefined;
}

function VideosSuggestedCreatorsRailInner({ userId }: VideosSuggestedCreatorsRailProps) {
  const { data: creators = [], isLoading } = useSuggestedCreators(userId);
  if (!userId) return null;
  if (isLoading) return null;
  if (creators.length === 0) return null;
  return (
    <section>
      <SectionHeader paddingTop={20} title="Suggested creators" sub="Golfers worth following" />
      <HRail paddingBottom={10}>
        {creators.map((c) => (
          <SuggestedCreatorCard key={c.userId} creator={c} currentUserId={userId} />
        ))}
      </HRail>
    </section>
  );
}

export const VideosSuggestedCreatorsRail = memo(VideosSuggestedCreatorsRailInner);
export default VideosSuggestedCreatorsRail;
