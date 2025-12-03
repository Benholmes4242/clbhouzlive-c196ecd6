import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  onViewAll?: () => void;
}

export const Top100ListFriendsCarousel: React.FC<Top100ListFriendsCarouselProps> = ({
  friends,
  totalInList,
  onViewAll,
}) => {
  const navigate = useNavigate();

  if (friends.length === 0) {
    return (
      <section className="mt-6">
        <div className="px-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Your friends on this list
          </h2>
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
      <div className="px-5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Your friends on this list
        </h2>
        {friends.length > 8 && (
          <button
            onClick={onViewAll}
            className="text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="mt-3 pl-4 pr-2 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {friends.slice(0, 10).map((friend) => (
          <button
            key={friend.id}
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="min-w-[120px] rounded-2xl bg-white shadow-sm px-3 py-3 flex flex-col items-center border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatarUrl || undefined} alt={friend.name} />
              <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                {friend.name[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="mt-2 text-[13px] font-semibold leading-tight text-slate-900 text-center truncate max-w-full">
              {friend.name}
            </div>
            <div className="text-[12px] text-slate-500">
              {friend.playedOnList}/{totalInList} played
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
