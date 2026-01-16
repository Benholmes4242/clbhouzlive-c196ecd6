import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface FriendSummary {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
  totalTop100Played?: number;
}

interface Top100ListFriendsCarouselProps {
  friends: FriendSummary[];
  totalInList: number;
  listName: string; // e.g., "Worldwide", "USA", "Britain & Ireland", "Continental Europe"
  onViewAll?: () => void;
}

export const Top100ListFriendsCarousel: React.FC<Top100ListFriendsCarouselProps> = ({
  friends,
  totalInList,
  listName,
  onViewAll,
}) => {
  const navigate = useNavigate();

  if (friends.length === 0) {
    return (
      <section className="mt-6">
        <div className="px-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Friends on this journey
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            See how your friends are progressing on the {listName} Top 100.
          </p>
        </div>
        <div className="mt-3 mx-4 px-4 py-4 rounded-sq-lg bg-slate-50 border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            No friends on this list yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Follow other golfers to see how they're progressing on this Top 100 list.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-squircle)] bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
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
      <div className="px-2.5 flex items-start justify-between">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Friends on this journey
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            See how your friends are progressing on the {listName} Top 100.
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

      <div className="-mx-4 flex gap-1 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none mt-3">
        {friends.slice(0, 10).map((friend, index) => {
          const isFirst = index === 0;
          const isLast = index === friends.slice(0, 10).length - 1;

          return (
            <button
              key={friend.id}
              type="button"
              onClick={() => navigate(`/profile/${friend.username}`)}
              className={`flex-shrink-0 w-32 snap-start text-center ${isFirst ? 'ml-4' : ''} ${isLast ? 'mr-4' : ''}`}
            >
              {/* Avatar - thin grey ring (no colored achievement rings) */}
              <div className="mx-auto">
                <SquircleAvatar
                  size={48}
                  src={friend.avatarUrl}
                  alt={friend.name}
                  fallback={friend.name[0]?.toUpperCase() || '?'}
                  thinRing
                />
              </div>

              {/* Text */}
              <div className="mt-2 space-y-0.5 w-full">
                <div className="text-sm font-semibold truncate max-w-full px-1">
                  {friend.name}
                </div>

                <div className="text-xs text-muted-foreground">
                  {friend.playedOnList}/{totalInList} played
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
