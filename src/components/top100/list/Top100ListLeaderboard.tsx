import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dev-only mock flag - disable after UI polish
const MOCK_TOP100_LEADERBOARD = import.meta.env.VITE_MOCK_TOP100_LEADERBOARD === 'true';

interface FriendLeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
  totalTop100Played?: number;
}

// Mock data for dev testing - 10 golfers with realistic variety
const MOCK_LEADERBOARD_DATA: FriendLeaderboardEntry[] = [
  { id: 'mock-1', name: 'James Wilson', username: 'jameswilson', avatarUrl: 'https://i.pravatar.cc/150?u=james', playedOnList: 42, totalTop100Played: 89 },
  { id: 'mock-2', name: 'Sarah Chen', username: 'sarahchen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', playedOnList: 31, totalTop100Played: 65 },
  { id: 'mock-3', name: 'Michael O\'Brien', username: 'mikeobrien', avatarUrl: null, playedOnList: 24, totalTop100Played: 48 },
  { id: 'mock-4', name: 'Emma Thompson', username: 'emmathompson', avatarUrl: 'https://i.pravatar.cc/150?u=emma', playedOnList: 19, totalTop100Played: 37 },
  { id: 'mock-5', name: 'David Park', username: 'davidpark', avatarUrl: 'https://i.pravatar.cc/150?u=david', playedOnList: 15, totalTop100Played: 28 },
  { id: 'mock-6', name: 'Rachel Adams', username: 'racheladams', avatarUrl: null, playedOnList: 11, totalTop100Played: 22 },
  { id: 'mock-7', name: 'Tom Hughes', username: 'tomhughes', avatarUrl: 'https://i.pravatar.cc/150?u=tom', playedOnList: 8, totalTop100Played: 15 },
  { id: 'mock-8', name: 'Lisa Martinez', username: 'lisamartinez', avatarUrl: 'https://i.pravatar.cc/150?u=lisa', playedOnList: 6, totalTop100Played: 12 },
  { id: 'mock-9', name: 'Chris Taylor', username: 'christaylor', avatarUrl: null, playedOnList: 3, totalTop100Played: 6 },
  { id: 'mock-10', name: 'Anna Schmidt', username: 'annaschmidt', avatarUrl: 'https://i.pravatar.cc/150?u=anna', playedOnList: 1, totalTop100Played: 2 },
];

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

  // Use mock data if flag is enabled and real data is empty
  const showMock = MOCK_TOP100_LEADERBOARD && friends.length === 0;
  const leaderboardFriends = showMock ? MOCK_LEADERBOARD_DATA : friends;

  // Sort friends by played count descending
  const sortedFriends = [...leaderboardFriends].sort((a, b) => b.playedOnList - a.playedOnList);

  // Contextual empty states based on friend/list conditions (only if not mocking)
  // Spacing: Header → copy = 12px (S), Copy → CTA = 16px (M), Button bottom → next = 24px (L)
  if (leaderboardFriends.length === 0) {
    return (
      <section className="px-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-3">
          Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
        </h2>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">
            No friends here yet
          </p>
          <p className="mt-3 text-sm text-slate-500 max-w-[240px] mx-auto">
            Follow golfers to compare progress on this Top 100.
          </p>
          <Button
            onClick={() => navigate('/golferstofollow')}
            className="w-full max-w-[280px] h-12 rounded-xl mt-4"
          >
            Find golfers to follow
          </Button>
        </div>
      </section>
    );
  }
  
  // Check if all friends have 0 progress - contextual "be the first" state
  const allFriendsHaveZero = friends.every(f => f.playedOnList === 0);
  if (allFriendsHaveZero && currentUserPlayed === 0) {
    return (
      <section className="px-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-3">
          Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
        </h2>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">
            Be the first
          </p>
          <p className="mt-3 text-sm text-slate-500 max-w-[240px] mx-auto">
            Start rating courses to set the pace for your friends.
          </p>
          <Button
            onClick={() => navigate('/courses')}
            className="w-full max-w-[280px] h-12 rounded-xl mt-4"
          >
            Explore courses
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header - Spacing: Header → content = 12px (S) */}
      <div className="px-4 flex items-start justify-between mb-3">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            See how you stack up against friends.
          </p>
        </div>
        {friends.length > 8 && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none pl-4">
        {sortedFriends.slice(0, 10).map((friend, index) => {
          // Calculate relative position
          const diff = friend.playedOnList - currentUserPlayed;
          const isAhead = diff > 0;
          const isBehind = diff < 0;
          const isSame = diff === 0;
          
          // Highlight closest competitor (smallest non-zero diff)
          const isClosestCompetitor = sortedFriends
            .filter(f => f.playedOnList !== currentUserPlayed)
            .sort((a, b) => Math.abs(a.playedOnList - currentUserPlayed) - Math.abs(b.playedOnList - currentUserPlayed))[0]?.id === friend.id;

          // Highlight current user (first position) with ring
          const isCurrentUser = index === 0;

          return (
            <motion.button
              key={friend.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigate(`/profile/${friend.username}`)}
              className={`
                flex-shrink-0 w-[68px] p-1.5 rounded-xl bg-white border transition-all text-center
                ${isCurrentUser ? 'border-amber-400 ring-2 ring-amber-400/20' : ''}
                ${isClosestCompetitor && !isCurrentUser ? 'border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]' : ''}
                ${!isCurrentUser && !isClosestCompetitor ? 'border-slate-100' : ''}
              `}
            >
              {/* Avatar with progress ring */}
              <div className="relative mx-auto mb-1">
                <SquircleAvatar
                  size={36}
                  src={friend.avatarUrl}
                  alt={friend.name}
                  fallback={friend.name[0]?.toUpperCase() || '?'}
                  ringColor={friend.totalTop100Played ? getRingColorForTotalPlayed(friend.totalTop100Played) : null}
                />
                {/* Mini progress badge - slightly smaller and darker */}
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-[7px] font-bold text-white"
                  title={`${friend.playedOnList}/${totalInList} played`}
                >
                  {friend.playedOnList}
                </div>
              </div>

              {/* Name - centered, truncated */}
              <div className="text-[10px] font-medium text-slate-900 truncate px-0.5">
                {friend.name.split(' ')[0]}
              </div>

              {/* Relative position indicator - smaller */}
              <div className={`
                mt-0.5 flex items-center justify-center gap-0.5 text-[8px] font-medium rounded-full px-1 py-0.5
                ${isAhead ? 'bg-emerald-50 text-emerald-600' : ''}
                ${isBehind ? 'bg-slate-50 text-slate-500' : ''}
                ${isSame ? 'bg-amber-50 text-amber-600' : ''}
              `}>
                {isAhead && (
                  <>
                    <ArrowUp className="w-2 h-2" />
                    <span>+{diff}</span>
                  </>
                )}
                {isBehind && (
                  <>
                    <ArrowDown className="w-2 h-2" />
                    <span>{diff}</span>
                  </>
                )}
                {isSame && (
                  <>
                    <Minus className="w-2 h-2" />
                    <span>Tied</span>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
        {/* End spacer to match right padding */}
        <div className="flex-shrink-0 w-2" aria-hidden="true" />
      </div>
    </section>
  );
};
