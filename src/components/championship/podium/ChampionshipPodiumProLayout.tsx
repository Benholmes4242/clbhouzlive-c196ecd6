import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/clbhouzAchievementPalette';

interface Leader {
  id: string;
  name: string;
  avatarUrl: string | null;
  homeClubName: string | null;
  statValue: number;
  statLabel: string;
  descriptor: string;
  rank: 1 | 2 | 3;
}

interface ChampionshipPodiumProLayoutProps {
  leaders: Leader[];
  mode: 'seasonal' | 'all_time';
  onLeaderPress?: (leaderId: string) => void;
}

/**
 * ChampionshipPodiumProLayout - Premium featured leader layout
 * 
 * Layout: Featured #1 on left (large), #2 and #3 stacked on right (mini cards)
 * Interactive: Clicking mini cards swaps them to featured position
 */
export const ChampionshipPodiumProLayout: React.FC<ChampionshipPodiumProLayoutProps> = ({
  leaders,
  mode,
  onLeaderPress,
}) => {
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Handle edge cases
  if (leaders.length === 0) return null;
  if (leaders.length === 1) {
    return (
      <div className="px-4">
        <FeaturedCard leader={leaders[0]} onPress={onLeaderPress} />
      </div>
    );
  }

  const featured = leaders[featuredIndex];
  const minis = leaders.filter((_, i) => i !== featuredIndex);

  const handleMiniClick = (leader: Leader) => {
    const newIndex = leaders.findIndex(l => l.id === leader.id);
    setFeaturedIndex(newIndex);
  };

  return (
    <div className="flex gap-3 px-4">
      {/* Featured (Left) - 58% width */}
      <div className="w-[58%] min-w-0">
        <FeaturedCard 
          leader={featured} 
          onPress={onLeaderPress}
        />
      </div>

      {/* Minis (Right, stacked) - 42% width */}
      <div className="w-[42%] flex flex-col gap-2">
        {minis.map((leader) => (
          <MiniCard
            key={leader.id}
            leader={leader}
            onPress={() => handleMiniClick(leader)}
          />
        ))}
      </div>
    </div>
  );
};

// Featured Card Component
const FeaturedCard: React.FC<{
  leader: Leader;
  onPress?: (id: string) => void;
}> = ({ leader, onPress }) => {
  const rankColors = {
    1: 'bg-amber-500',
    2: 'bg-slate-400',
    3: 'bg-orange-400',
  };

  const initials = leader.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div
      onClick={() => onPress?.(leader.id)}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all duration-200",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "hover:shadow-md"
      )}
    >
      {/* Rank Badge */}
      <div className={cn(
        "absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center",
        "text-white text-xs font-bold shadow-sm",
        rankColors[leader.rank]
      )}>
        {leader.rank}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center pt-3">
        <SquircleAvatar
          size={64}
          src={leader.avatarUrl}
          alt={leader.name}
          fallback={initials}
          top100Count={leader.statValue}
          className="shadow-lg"
        />

        <h3 className="mt-2 font-semibold text-sm truncate max-w-full">
          {leader.name}
        </h3>

        {leader.homeClubName && (
          <p className="text-[11px] text-muted-foreground truncate max-w-full">
            {leader.homeClubName}
          </p>
        )}

        <p className="mt-1.5 text-xl font-black text-primary">
          {leader.statValue}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {leader.statLabel}
          </span>
        </p>

        <p className="mt-1 text-[11px] text-muted-foreground italic">
          {leader.descriptor}
        </p>
      </div>
    </div>
  );
};

// Mini Card Component
const MiniCard: React.FC<{
  leader: Leader;
  onPress: () => void;
}> = ({ leader, onPress }) => {
  const rankColors = {
    1: 'bg-amber-500',
    2: 'bg-slate-400',
    3: 'bg-orange-400',
  };

  const initials = leader.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div
      onClick={onPress}
      className={cn(
        "relative flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200",
        "bg-muted/30 hover:bg-muted/50",
        "border border-transparent hover:border-muted"
      )}
    >
      {/* Rank Badge */}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
        "text-white text-xs font-bold",
        rankColors[leader.rank]
      )}>
        {leader.rank}
      </div>

      {/* Avatar */}
      <SquircleAvatar
        size={36}
        src={leader.avatarUrl}
        alt={leader.name}
        fallback={initials}
        top100Count={leader.statValue}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{leader.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {leader.statValue} {leader.statLabel}
        </p>
      </div>
    </div>
  );
};

export default ChampionshipPodiumProLayout;
