import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <section className="w-full mt-6">
      <div className="w-full rounded-2xl bg-card border border-border/70 shadow-sm px-4 py-3 md:px-5 md:py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary-accent flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                Friends chasing the Top 100
              </span>
              {friendMessage && (
                <span className="text-xs text-muted-foreground">
                  {friendMessage}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onViewLeaderboard}
            className="inline-flex items-center gap-1 rounded-full border border-primary-accent/40 bg-primary-accent/5 px-3 py-1 text-[11px] font-medium text-primary-accent hover:bg-primary-accent/10 active:bg-primary-accent/15 transition-colors"
          >
            <span>Top 10</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Friend rows (mini leaderboard) */}
        <div className="mt-3 space-y-2">
          {topFriends.map((friend, index) => (
            <button
              key={friend.friend_id}
              type="button"
              onClick={() => navigate(`/profile/${friend.friend_id}?tab=top100`)}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-muted/70 transition-colors"
            >
              {/* Left side: avatar + name/club + counts */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar squircle */}
                {friend.profile_photo_url ? (
                  <img
                    src={friend.profile_photo_url}
                    alt={friend.display_name ?? 'Golfer'}
                    className="w-9 h-9 rounded-[28%] object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-[28%] bg-muted flex items-center justify-center text-[11px] font-semibold text-foreground/70 flex-shrink-0">
                    {getInitials(friend.display_name)}
                  </div>
                )}

                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-medium truncate">
                    {friend.display_name ?? 'Unknown golfer'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {friend.total_top100_played} Top 100s
                    {friend.home_club && ` · ${friend.home_club}`}
                  </span>
                </div>
              </div>

              {/* Right side: rank pill */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <span className="inline-flex items-center justify-center rounded-full border border-border/70 px-2 py-[3px] text-[11px] text-foreground/80">
                  View
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Top100FriendsActivityCard;
