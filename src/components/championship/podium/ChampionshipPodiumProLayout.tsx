import React from 'react';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
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
 * ChampionshipPodiumProLayout - Classic 3-column podium layout
 * 
 * Layout: 2nd (left) - 1st (center, tallest) - 3rd (right)
 * Uses podium blocks with gradient backgrounds
 */
export const ChampionshipPodiumProLayout: React.FC<ChampionshipPodiumProLayoutProps> = ({
  leaders,
  mode,
  onLeaderPress,
}) => {
  if (leaders.length === 0) return null;

  const first = leaders.find(l => l.rank === 1);
  const second = leaders.find(l => l.rank === 2);
  const third = leaders.find(l => l.rank === 3);

  const isSeasonal = mode === 'seasonal';

  const PodiumSpot: React.FC<{
    leader: Leader | undefined;
    height: string;
    position: 1 | 2 | 3;
  }> = ({ leader, height, position }) => {
    if (!leader) return <div className="flex-1" />;

    const bgColors = {
      1: 'bg-gradient-to-t from-amber-100 to-amber-50',
      2: 'bg-gradient-to-t from-slate-100 to-slate-50',
      3: 'bg-gradient-to-t from-orange-100 to-orange-50',
    };

    const initials = leader.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

    return (
      <div 
        className="flex-1 flex flex-col items-center cursor-pointer"
        onClick={() => onLeaderPress?.(leader.id)}
      >
        {/* User info above podium */}
        <div className="flex flex-col items-center mb-2">
          {/* Crown for 1st */}
          {position === 1 && (
            <Crown className={cn("w-8 h-8 mb-1 text-amber-500", isSeasonal && "animate-pulse-subtle")} />
          )}
          
          {/* Avatar with squircle shape - milestone ring colors */}
          <div className="relative">
            <SquircleAvatar
              size={position === 1 ? 80 : 64}
              src={leader.avatarUrl}
              alt={leader.name}
              fallback={initials}
              ringColor={getRingColorForTotalPlayed(leader.statValue)}
            />
            
            {/* Position badge - squircle shape */}
            <div 
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2",
                "flex items-center justify-center",
                "text-sm font-bold text-white shadow-md",
                position === 1 && "bg-amber-500",
                position === 2 && "bg-slate-400",
                position === 3 && "bg-orange-400",
              )}
              style={{
                width: '28px',
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
              }}
            >
              {position}
            </div>
          </div>

          {/* Name */}
          <p className={cn(
            "mt-3 font-semibold text-center truncate max-w-[100px]",
            position === 1 ? "text-sm" : "text-xs"
          )}>
            {leader.name}
          </p>

          {/* Courses count */}
          <p className={cn(
            "font-bold",
            position === 1 ? "text-xl text-amber-600" : "text-lg text-muted-foreground"
          )}>
            {leader.statValue}
            <span className="text-xs font-normal ml-1">{leader.statLabel}</span>
          </p>

          {/* Narrative */}
          <p className="text-[10px] text-muted-foreground text-center italic max-w-[100px]">
            {leader.descriptor}
          </p>
        </div>

        {/* Podium block */}
        <div 
          className={cn(
            "w-full rounded-t-lg transition-all",
            bgColors[position],
            position === 1 && isSeasonal && "shadow-lg shadow-amber-200/50"
          )}
          style={{ height }}
        >
          <div className="w-full h-full flex items-end justify-center pb-2">
            <span className={cn(
              "text-2xl font-black opacity-20",
              position === 1 && "text-amber-600",
              position === 2 && "text-slate-500",
              position === 3 && "text-orange-500",
            )}>
              {position}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "w-full px-4 py-6",
      !isSeasonal && "bg-slate-900/5 rounded-sq-lg"
    )}>
      {/* Podium title */}
      <div className="text-center mb-4">
        <h3 className={cn(
          "text-sm font-semibold uppercase tracking-wider",
          isSeasonal ? "text-muted-foreground" : "text-slate-600"
        )}>
          {isSeasonal ? 'Season Leaders' : '🏛️ Hall of Fame'}
        </h3>
      </div>

      {/* Podium visual - 2nd, 1st (center), 3rd */}
      <div className="flex items-end justify-center gap-2 max-w-md mx-auto">
        <PodiumSpot leader={second} height="80px" position={2} />
        <PodiumSpot leader={first} height="110px" position={1} />
        <PodiumSpot leader={third} height="60px" position={3} />
      </div>
    </div>
  );
};

export default ChampionshipPodiumProLayout;
