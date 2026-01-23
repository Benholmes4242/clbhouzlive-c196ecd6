import React from 'react';
import { usePodiumSeasonal } from '@/hooks/championship/usePodiumSeasonal';
import { PodiumLayout } from './PodiumLayout';
import { PodiumProximityBanner } from './PodiumProximityBanner';
import { PodiumScope } from '@/types/podium';
import { Skeleton } from '@/components/ui/skeleton';

interface SeasonalPodiumProps {
  scope: PodiumScope;
  divisionId?: string;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

export const SeasonalPodium: React.FC<SeasonalPodiumProps> = ({
  scope,
  divisionId,
  currentUserId,
  onUserClick,
}) => {
  const { data: entries, isLoading } = usePodiumSeasonal({
    scope,
    divisionId,
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
        mode="seasonal"
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
      <PodiumProximityBanner
        userId={currentUserId}
        mode="seasonal"
        scope={scope}
        divisionId={divisionId}
      />
    </div>
  );
};
