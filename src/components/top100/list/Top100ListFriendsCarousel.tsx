import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Squircle } from '@/components/ui/squircle';

interface FriendSummary {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
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
        <div className="px-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Friends on this journey
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            See how your friends are progressing on the {listName} Top 100.
          </p>
        </div>
        <div className="mt-3 mx-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 text-center">
            None of your friends have started this list yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="px-5 flex items-start justify-between">
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

      <div className="mt-3 pl-4 pr-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {friends.slice(0, 10).map((friend) => (
          <button
            key={friend.id}
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="min-w-[100px] rounded-2xl bg-white shadow-sm px-2 py-2 flex flex-col items-center border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <Squircle width={36} height={36}>
              {friend.avatarUrl ? (
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-medium">
                  {friend.name[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Squircle>
            <div className="mt-1.5 text-[12px] font-semibold leading-tight text-slate-900 text-center truncate max-w-full">
              {friend.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {friend.playedOnList}/{totalInList} played
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
