import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Top100FriendEntry {
  friend_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  total_top100_played: number;
}

interface Top100FriendsActivityCardProps {
  friends: Top100FriendEntry[];
  friendMessage: string | null;
  onViewLeaderboard: () => void;
}

const Top100FriendsActivityCard: React.FC<Top100FriendsActivityCardProps> = ({ 
  friends, 
  friendMessage,
  onViewLeaderboard 
}) => {
  const navigate = useNavigate();

  // Show top 3 friends sorted by total_top100_played
  const topFriends = friends
    .slice()
    .sort((a, b) => b.total_top100_played - a.total_top100_played)
    .slice(0, 3);

  if (topFriends.length === 0) {
    return null;
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="rounded-2xl bg-card border border-border/60 shadow-xs px-4 py-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">
            Friends chasing the Top 100
          </h3>
          {friendMessage && (
            <p className="text-xs text-muted-foreground">
              {friendMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onViewLeaderboard}
          className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Top 10
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Friend rows */}
      <div className="space-y-1.5">
        {topFriends.map((friend, index) => {
          const rank = index + 1;
          const initials = getInitials(friend.display_name);

          return (
            <button
              key={friend.friend_id}
              type="button"
              onClick={() => navigate(`/profile/${friend.friend_id}?tab=top100`)}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-muted/60 transition-colors"
            >
              {/* Left: avatar + text */}
              <div className="flex items-center gap-2.5">
                {friend.profile_photo_url ? (
                  <img
                    src={friend.profile_photo_url}
                    className="h-8 w-8 rounded-[30%] object-cover"
                    alt={friend.display_name ?? 'Friend'}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-[30%] bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                    {initials}
                  </div>
                )}

                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-foreground">
                    {friend.display_name ?? 'Unknown golfer'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {friend.total_top100_played} Top 100 rounds
                    {friend.home_club && ` · ${friend.home_club}`}
                  </span>
                </div>
              </div>

              {/* Right: rank pill */}
              <div
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                  rank === 1
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : rank === 2
                    ? 'bg-slate-50 text-slate-700 border border-slate-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                )}
              >
                #{rank}
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional footer – link to full friends leaderboard */}
      {friends.length > 3 && (
        <button
          type="button"
          onClick={onViewLeaderboard}
          className="w-full text-center text-[11px] text-muted-foreground pt-1 hover:text-foreground transition-colors"
        >
          +{friends.length - 3} more players
        </button>
      )}
    </section>
  );
};

export default Top100FriendsActivityCard;
