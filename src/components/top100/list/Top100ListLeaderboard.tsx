import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface FriendLeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
  totalTop100Played?: number;
}

interface Top100ListLeaderboardProps {
  friends: FriendLeaderboardEntry[];
  totalInList: number;
  listName: string;
  currentUserPlayed: number;
  onViewAll?: () => void;
}

/**
 * Social leaderboard showing friends' progress with relative position indicators.
 */
export const Top100ListLeaderboard: React.FC<Top100ListLeaderboardProps> = ({
  friends,
  totalInList,
  listName,
  currentUserPlayed,
  onViewAll,
}) => {
  const navigate = useNavigate();

  // Sort friends by played count descending
  const sortedFriends = [...friends].sort((a, b) => b.playedOnList - a.playedOnList);

  if (friends.length === 0) {
    return (
      <section className="mt-6">
        <div className="px-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            See how your friends are progressing.
          </p>
        </div>
        <div className="mt-3 mx-4 px-4 py-4 rounded-sq-lg bg-slate-50 border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            No friends on this list yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Follow other golfers to see how they're progressing.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-sq-sm bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            onClick={() => navigate('/golferstofollow')}
          >
            Find golfers to follow
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="px-4 flex items-start justify-between">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            See how you stack up against friends.
          </p>
        </div>
        {friends.length > 8 && (
          <button
            onClick={onViewAll}
            className="text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none mt-3 px-4">
        {sortedFriends.slice(0, 10).map((friend) => {
          // Calculate relative position
          const diff = friend.playedOnList - currentUserPlayed;
          const isAhead = diff > 0;
          const isBehind = diff < 0;
          const isSame = diff === 0;
          
          // Highlight closest competitor (smallest non-zero diff)
          const isClosestCompetitor = sortedFriends
            .filter(f => f.playedOnList !== currentUserPlayed)
            .sort((a, b) => Math.abs(a.playedOnList - currentUserPlayed) - Math.abs(b.playedOnList - currentUserPlayed))[0]?.id === friend.id;

          return (
            <button
              key={friend.id}
              type="button"
              onClick={() => navigate(`/profile/${friend.username}`)}
              className={`
                flex-shrink-0 w-28 snap-start p-3 rounded-sq-md bg-white border transition-all
                ${isClosestCompetitor ? 'border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]' : 'border-slate-100'}
              `}
            >
              {/* Avatar with progress ring */}
              <div className="relative mx-auto mb-2">
                <SquircleAvatar
                  size={44}
                  src={friend.avatarUrl}
                  alt={friend.name}
                  fallback={friend.name[0]?.toUpperCase() || '?'}
                  ringColor={friend.totalTop100Played ? getRingColorForTotalPlayed(friend.totalTop100Played) : null}
                />
                {/* Mini progress ring indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-bold text-white"
                  title={`${friend.playedOnList}/${totalInList} played`}
                >
                  {friend.playedOnList}
                </div>
              </div>

              {/* Name */}
              <div className="text-xs font-semibold text-slate-900 truncate">
                {friend.name.split(' ')[0]}
              </div>

              {/* Progress */}
              <div className="text-[10px] text-slate-500 mt-0.5">
                {friend.playedOnList}/{totalInList}
              </div>

              {/* Relative position indicator */}
              <div className={`
                mt-1.5 flex items-center justify-center gap-0.5 text-[10px] font-medium rounded-sq-pill px-2 py-0.5
                ${isAhead ? 'bg-emerald-50 text-emerald-600' : ''}
                ${isBehind ? 'bg-slate-50 text-slate-500' : ''}
                ${isSame ? 'bg-amber-50 text-amber-600' : ''}
              `}>
                {isAhead && (
                  <>
                    <ArrowUp className="w-2.5 h-2.5" />
                    <span>{diff} ahead</span>
                  </>
                )}
                {isBehind && (
                  <>
                    <ArrowDown className="w-2.5 h-2.5" />
                    <span>{Math.abs(diff)} behind</span>
                  </>
                )}
                {isSame && (
                  <>
                    <Minus className="w-2.5 h-2.5" />
                    <span>Tied</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
