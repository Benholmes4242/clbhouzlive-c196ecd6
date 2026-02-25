import React from 'react';
import { SeasonalPodiumEntry } from '@/types/podium';
import { getSeasonGradient } from '@/lib/colorUtils';
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
 * TrophyPodium — Premium awards stage with spotlight effect.
 * Stepped vertical positioning creates the podium feel.
 */
export const TrophyPodium: React.FC<TrophyPodiumProps> = ({
  entries,
  seasonThemeColor = '#22c55e',
  currentUserId,
  onUserClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex items-end justify-center gap-6">
          <div className="flex flex-col items-center">
            <Skeleton className="w-[68px] h-[68px]" style={{ borderRadius: '34%' }} />
            <Skeleton className="w-14 h-4 mt-2 rounded" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="w-7 h-7 mb-1 rounded" />
            <Skeleton className="w-[90px] h-[90px]" style={{ borderRadius: '34%' }} />
            <Skeleton className="w-16 h-5 mt-2 rounded" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="w-[68px] h-[68px]" style={{ borderRadius: '34%' }} />
            <Skeleton className="w-14 h-4 mt-2 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <div className="flex items-end justify-center gap-8 opacity-40">
          {[2, 1, 3].map((pos) => (
            <div key={pos} className="flex flex-col items-center">
              <div
                className="bg-muted flex items-center justify-center text-muted-foreground text-2xl font-medium"
                style={{ width: pos === 1 ? 90 : 68, height: pos === 1 ? 90 : 68, borderRadius: '34%' }}
              >
                ?
              </div>
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

  // Staggered animation: #2 → #1 → #3
  const delays = { 2: 0, 1: 0.1, 3: 0.2 };

  return (
    <div className="w-full py-8 overflow-visible relative">
      {/* Subtle radial spotlight behind #1 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 50% 35%, ${getSeasonGradient(seasonThemeColor).subtleTint} 0%, transparent 70%)`,
        }}
      />

      {/* Podium Layout: 2nd - 1st - 3rd with stepped vertical positioning */}
      <div className="flex items-start justify-center relative">
        <TrophyPodiumSlot
          entry={second}
          position={2}
          seasonThemeColor={seasonThemeColor}
          isCurrentUser={second?.user_id === currentUserId}
          onClick={() => second && onUserClick?.(second.user_id)}
          animationDelay={delays[2]}
        />

        <TrophyPodiumSlot
          entry={first}
          position={1}
          seasonThemeColor={seasonThemeColor}
          isCurrentUser={first?.user_id === currentUserId}
          onClick={() => first && onUserClick?.(first.user_id)}
          animationDelay={delays[1]}
        />

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
