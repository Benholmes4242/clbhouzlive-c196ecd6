import React from 'react';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import { PodiumLayout } from './PodiumLayout';
import { PodiumProximityBanner } from './PodiumProximityBanner';
import { PodiumScope } from '@/types/podium';
import { Skeleton } from '@/components/ui/skeleton';

interface HallOfFamePodiumProps {
  scope: PodiumScope;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

export const HallOfFamePodium: React.FC<HallOfFamePodiumProps> = ({
  scope,
  currentUserId,
  onUserClick,
}) => {
  const { data: entries, isLoading } = usePodiumAllTime({
    scope,
    currentUserId,
  });

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-end justify-center gap-3 max-w-lg mx-auto px-4">
          <Skeleton className="h-36 w-[140px] rounded-xl" />
          <Skeleton className="h-44 w-[160px] rounded-xl" />
          <Skeleton className="h-36 w-[140px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <div>
      <PodiumLayout
        entries={entries}
        mode="all_time"
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
      <PodiumProximityBanner userId={currentUserId} mode="all_time" scope={scope} />
    </div>
  );
};
