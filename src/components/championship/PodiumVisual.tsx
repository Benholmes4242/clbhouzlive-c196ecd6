import React from 'react';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface PodiumUser {
  position: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  courses: number;
  narrative: string;
}

interface PodiumVisualProps {
  users: PodiumUser[];
  currentUserId?: string;
  mode: 'seasonal' | 'all_time';
  onUserClick?: (userId: string) => void;
}

export const PodiumVisual: React.FC<PodiumVisualProps> = ({
  users,
  currentUserId,
  mode,
  onUserClick,
}) => {
  const first = users.find(u => u.position === 1);
  const second = users.find(u => u.position === 2);
  const third = users.find(u => u.position === 3);

  const isSeasonal = mode === 'seasonal';

  const PodiumSpot: React.FC<{
    user: PodiumUser | undefined;
    height: string;
    position: 1 | 2 | 3;
  }> = ({ user, height, position }) => {
    if (!user) return <div className="flex-1" />;

    const isCurrentUser = user.userId === currentUserId;
    const ringColors = {
      1: 'ring-amber-400 ring-4',
      2: 'ring-slate-300 ring-[3px]',
      3: 'ring-orange-400 ring-[3px]',
    };
    const bgColors = {
      1: 'bg-gradient-to-t from-amber-100 to-amber-50',
      2: 'bg-gradient-to-t from-slate-100 to-slate-50',
      3: 'bg-gradient-to-t from-orange-100 to-orange-50',
    };
    const crownColors = {
      1: 'text-amber-500',
      2: 'text-slate-400',
      3: 'text-orange-400',
    };

    return (
      <div 
        className="flex-1 flex flex-col items-center cursor-pointer"
        onClick={() => onUserClick?.(user.userId)}
      >
        {/* User info above podium */}
        <div className="flex flex-col items-center mb-2">
          {/* Crown/Medal for 1st */}
          {position === 1 && (
            <Crown className={cn("w-8 h-8 mb-1", crownColors[1], isSeasonal && "animate-pulse-subtle")} />
          )}
          
          {/* Avatar with squircle shape */}
          <div className="relative">
            <SquircleAvatar
              size={position === 1 ? 80 : 64}
              src={user.avatarUrl}
              alt={user.displayName}
              fallback={user.displayName?.charAt(0) || '?'}
              ringColor={
                position === 1 ? '#FBBF24' : 
                position === 2 ? '#94A3B8' : 
                '#FB923C'
              }
              className={cn(
                isCurrentUser && "ring-offset-2 ring-offset-primary"
              )}
            />
            
            {/* Position badge - squircle shape to match */}
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
            {user.displayName}
          </p>

          {/* Courses */}
          <p className={cn(
            "font-bold",
            position === 1 ? "text-xl text-amber-600" : "text-lg text-muted-foreground"
          )}>
            {user.courses}
            <span className="text-xs font-normal ml-1">courses</span>
          </p>

          {/* Narrative */}
          <p className="text-[10px] text-muted-foreground text-center italic max-w-[100px]">
            {user.narrative}
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
      !isSeasonal && "bg-slate-900/5 rounded-sq-lg" // Hall of Fame darker treatment
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

      {/* Podium visual */}
      <div className="flex items-end justify-center gap-2 max-w-md mx-auto">
        {/* 2nd place - left */}
        <PodiumSpot user={second} height="80px" position={2} />
        
        {/* 1st place - center (tallest) */}
        <PodiumSpot user={first} height="110px" position={1} />
        
        {/* 3rd place - right */}
        <PodiumSpot user={third} height="60px" position={3} />
      </div>
    </div>
  );
};
