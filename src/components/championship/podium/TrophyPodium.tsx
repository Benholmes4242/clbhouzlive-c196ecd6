import React from 'react';
import { SeasonalPodiumEntry } from '@/types/podium';
import { TrophyPodiumSlot } from './TrophyPodiumSlot';
import { Skeleton } from '@/components/ui/skeleton';

interface TrophyPodiumProps {
  entries: SeasonalPodiumEntry[];
  seasonThemeColor?: string;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  isLoading?: boolean;
}

/**
 * TrophyPodium - Premium podium ceremony design
 * 
 * Features:
 * - 2nd - 1st - 3rd layout (podium ceremony order)
 * - 1st place elevated with crown and glow
 * - Metallic borders (gold, silver, bronze)
 * - Platform heights create visual depth
 * - Season theme color integration
 * - Staggered entry animations
 */
export const TrophyPodium: React.FC<TrophyPodiumProps> = ({
  entries,
  seasonThemeColor = '#22c55e',
  currentUserId,
  onUserClick,
  isLoading = false,
}) => {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="w-full py-4">
        <div className="flex items-end justify-between">
          {/* 2nd place skeleton */}
          <div className="flex flex-col items-center flex-1">
            <Skeleton className="w-6 h-6 rounded-full mb-2" />
            <Skeleton className="w-[84px] h-[84px] rounded-full" />
            <Skeleton className="w-16 h-4 mt-2 rounded" />
            <Skeleton className="w-12 h-5 mt-1 rounded" />
            <Skeleton className="w-full max-w-[130px] h-8 mt-2 rounded-t-lg" />
          </div>
          
          {/* 1st place skeleton (taller) */}
          <div className="flex flex-col items-center flex-1">
            <Skeleton className="w-7 h-7 mb-1" />
            <Skeleton className="w-[103px] h-[103px] rounded-full" />
            <Skeleton className="w-20 h-5 mt-2 rounded" />
            <Skeleton className="w-14 h-6 mt-1 rounded" />
            <Skeleton className="w-full max-w-[130px] h-12 mt-2 rounded-t-lg" />
          </div>
          
          {/* 3rd place skeleton */}
          <div className="flex flex-col items-center flex-1">
            <Skeleton className="w-6 h-6 rounded-full mb-2" />
            <Skeleton className="w-[84px] h-[84px] rounded-full" />
            <Skeleton className="w-16 h-4 mt-2 rounded" />
            <Skeleton className="w-12 h-5 mt-1 rounded" />
            <Skeleton className="w-full max-w-[130px] h-6 mt-2 rounded-t-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!entries || entries.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <div className="flex items-end justify-between opacity-40">
          {[2, 1, 3].map((pos) => (
            <div
              key={pos}
              className="flex flex-col items-center flex-1"
            >
              <div
                className="rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium"
                style={{
                  width: pos === 1 ? 103 : 84,
                  height: pos === 1 ? 103 : 84,
                }}
              >
                ?
              </div>
              <div
                className="w-full max-w-[130px] mt-4 rounded-t-lg bg-muted/50"
                style={{ height: pos === 1 ? 48 : pos === 2 ? 32 : 24 }}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Complete courses to claim the podium!
        </p>
      </div>
    );
  }

  const first = entries.find((e) => e.podium_position === 1);
  const second = entries.find((e) => e.podium_position === 2);
  const third = entries.find((e) => e.podium_position === 3);

  // Animation delays for staggered entrance (2nd → 1st → 3rd)
  const delays = { 2: 0, 1: 0.15, 3: 0.3 };

  return (
    <div className="w-full pt-6 pb-4 overflow-visible">
      {/* Podium Layout: 2nd - 1st (elevated) - 3rd - full width, no gaps */}
      <div className="flex items-end justify-between">
        {/* 2nd Place - Left */}
        <TrophyPodiumSlot
          entry={second}
          position={2}
          seasonThemeColor={seasonThemeColor}
          isCurrentUser={second?.user_id === currentUserId}
          onClick={() => second && onUserClick?.(second.user_id)}
          animationDelay={delays[2]}
        />

        {/* 1st Place - Center (elevated via larger platform) */}
        <TrophyPodiumSlot
          entry={first}
          position={1}
          seasonThemeColor={seasonThemeColor}
          isCurrentUser={first?.user_id === currentUserId}
          onClick={() => first && onUserClick?.(first.user_id)}
          animationDelay={delays[1]}
        />

        {/* 3rd Place - Right */}
        <TrophyPodiumSlot
          entry={third}
          position={3}
          seasonThemeColor={seasonThemeColor}
          isCurrentUser={third?.user_id === currentUserId}
          onClick={() => third && onUserClick?.(third.user_id)}
          animationDelay={delays[3]}
        />
      </div>
    </div>
  );
};
