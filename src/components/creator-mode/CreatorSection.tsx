import { useState } from 'react';
import { useCreatorProfile } from './hooks/useCreatorProfile';
import { CreatorFeaturedVideo } from './CreatorFeaturedVideo';
import { CreatorPinnedPosts } from './CreatorPinnedPosts';
import { CreatorWeeklyStatsBar } from './CreatorWeeklyStats';
import { CreatorPostPicker } from './CreatorPostPicker';
import { CreatorSectionSkeleton } from './CreatorSectionSkeleton';

interface CreatorSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export function CreatorSection({ userId, isOwnProfile }: CreatorSectionProps) {
  const { data, isLoading } = useCreatorProfile(userId);
  const [pickerMode, setPickerMode] = useState<'featured' | 'pinned' | null>(null);

  console.log('[CreatorSection] render — isCreator:', data?.isCreator, 'featured:', data?.featuredPost?.id, 'pinned:', data?.pinnedPosts?.length);

  if (isLoading) return <CreatorSectionSkeleton />;
  if (!data?.isCreator) return null;

  return (
    <div className="px-3 py-2 space-y-3">
      <CreatorFeaturedVideo
        post={data.featuredPost}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setPickerMode('featured')}
      />

      <CreatorPinnedPosts
        posts={data.pinnedPosts}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setPickerMode('pinned')}
      />

      <CreatorWeeklyStatsBar
        stats={data.weeklyStats}
        isOwnProfile={isOwnProfile}
      />

      {isOwnProfile && pickerMode && (
        <CreatorPostPicker
          isOpen
          onClose={() => setPickerMode(null)}
          userId={userId}
          mode={pickerMode}
          currentFeaturedId={data.featuredPost?.id}
          currentPinnedIds={data.pinnedPosts.map((p) => p.id)}
          onSelectFeatured={() => setPickerMode(null)}
          onSelectPinned={() => setPickerMode(null)}
        />
      )}
    </div>
  );
}
