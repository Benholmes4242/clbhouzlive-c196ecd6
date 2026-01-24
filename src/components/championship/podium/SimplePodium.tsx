import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PodiumUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  courses: number;
  position: 1 | 2 | 3;
}

interface SimplePodiumProps {
  users: PodiumUser[];
  onUserClick?: (userId: string) => void;
}

const getPositionColor = (position: number) => {
  if (position === 1) return '#F59E0B'; // Gold/Amber
  if (position === 2) return '#94A3B8'; // Silver/Slate
  if (position === 3) return '#F97316'; // Bronze/Orange
  return '#9CA3AF'; // Grey
};

const getCoursesColor = (position: number) => {
  if (position === 1) return 'text-amber-500';
  if (position === 2) return 'text-slate-400';
  if (position === 3) return 'text-orange-500';
  return 'text-muted-foreground';
};

/**
 * SimplePodium - Clean, minimal podium design
 * 
 * Features:
 * - No colored blocks
 * - No crown icon
 * - Avatars with position badges
 * - Full names (2 lines allowed)
 * - 2nd - 1st - 3rd layout
 */
export const SimplePodium: React.FC<SimplePodiumProps> = ({
  users,
  onUserClick,
}) => {
  if (users.length === 0) return null;

  // Arrange as: 2nd, 1st, 3rd
  const first = users.find(u => u.position === 1);
  const second = users.find(u => u.position === 2);
  const third = users.find(u => u.position === 3);

  const arranged = [second, first, third].filter(Boolean) as PodiumUser[];

  return (
    <div className="py-4">
      <div className="flex justify-center items-end gap-6">
        {arranged.map((user) => (
          <div
            key={user.id}
            onClick={() => onUserClick?.(user.id)}
            className={cn(
              "flex flex-col items-center cursor-pointer",
              user.position === 1 && "scale-110"
            )}
          >
            {/* Avatar with position badge */}
            <div className="relative">
              <Avatar className={cn(
                "border-2 border-white shadow-lg",
                user.position === 1 ? "w-20 h-20" : "w-16 h-16"
              )}>
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {user.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              {/* Position Badge - bottom right */}
              <div 
                className={cn(
                  "absolute -bottom-1 -right-1 rounded-full flex items-center justify-center text-white font-bold shadow-md",
                  user.position === 1 ? "w-7 h-7 text-sm" : "w-6 h-6 text-xs"
                )}
                style={{ backgroundColor: getPositionColor(user.position) }}
              >
                {user.position}
              </div>
            </div>

            {/* Name - allow 2 lines */}
            <p className={cn(
              "mt-2 font-semibold text-center leading-tight max-w-[100px]",
              user.position === 1 ? "text-sm" : "text-xs"
            )}>
              {user.name}
            </p>

            {/* Courses count */}
            <p className={cn(
              "text-xs mt-0.5",
              getCoursesColor(user.position)
            )}>
              {user.courses} courses
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimplePodium;
