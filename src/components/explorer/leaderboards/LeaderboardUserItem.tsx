import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  country: string;
  countryFlag: string;
  coursesPlayed: number;
  totalCourses: number;
  avgRating: number;
  mediaUploaded: number;
  globalRank?: number;
}

interface LeaderboardUserItemProps {
  user: LeaderboardUser;
  rank: number;
}

const LeaderboardUserItem: React.FC<LeaderboardUserItemProps> = ({ user, rank }) => {
  const getBadgeForProgress = (coursesPlayed: number) => {
    if (coursesPlayed >= 400) return { emoji: '🏆', text: 'Clbhouz Global Finisher', color: 'bg-purple-600' };
    if (coursesPlayed >= 300) return { emoji: '💎', text: '300 Club', color: 'bg-blue-600' };
    if (coursesPlayed >= 200) return { emoji: '🥉', text: '200 Club', color: 'bg-orange-500' };
    if (coursesPlayed >= 100) return { emoji: '🥇', text: 'Top 100 Finisher', color: 'bg-yellow-500' };
    if (coursesPlayed >= 75) return { emoji: '🥈', text: '75 Club', color: 'bg-gray-400' };
    if (coursesPlayed >= 50) return { emoji: '🏅', text: '50 Club', color: 'bg-yellow-400' };
    if (coursesPlayed >= 20) return { emoji: '🎖️', text: '20 Club', color: 'bg-amber-600' };
    return null;
  };

  const badge = getBadgeForProgress(user.coursesPlayed);

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
      {/* Rank */}
      <div className="w-8 text-center">
        <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
      </div>

      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="text-sm font-semibold bg-primary/10">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        {rank === 1 && (
          <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold truncate text-sm">{user.name}</h4>
          <span className="text-sm">{user.countryFlag}</span>
        </div>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
        {badge && (
          <Badge variant="secondary" className="text-xs mt-1">
            {badge.emoji} {badge.text}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="text-lg font-bold">{user.coursesPlayed}</div>
        <div className="text-xs text-muted-foreground">plays</div>
        <div className="text-xs text-muted-foreground mt-1">
          🏌️‍♂️ {user.mediaUploaded} posts
        </div>
      </div>
    </div>
  );
};

export default LeaderboardUserItem;