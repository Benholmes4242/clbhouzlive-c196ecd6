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
  listName: string;
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
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Friends on this journey
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            See how your friends are progressing on the {listName}.
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
      <div className="px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Friends on this journey
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
        <p className="mt-1 text-[13px] text-slate-500">
          See how your friends are progressing on the {listName}.
        </p>
      </div>

      <div className="mt-3 pl-4 pr-2 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {friends.slice(0, 10).map((friend) => (
          <button
            key={friend.id}
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="min-w-[120px] rounded-2xl bg-white shadow-sm px-3 py-3 flex flex-col items-center border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <Squircle width={44} height={44}>
              {friend.avatarUrl ? (
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-base">
                  {friend.name[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Squircle>
            <div className="mt-2 text-[13px] font-semibold leading-tight text-slate-900 text-center truncate max-w-full">
              {friend.name}
            </div>
            <div className="text-[12px] text-slate-500">
              {friend.playedOnList}/{totalInList} played
            </div>
          </button>
        ))}
        
        {/* +X more tile */}
        {friends.length > 10 && (
          <button
            onClick={onViewAll}
            className="min-w-[80px] rounded-2xl bg-white shadow-sm px-3 py-3 flex flex-col items-center justify-center border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div className="text-[15px] font-semibold text-slate-600">
              +{friends.length - 10}
            </div>
            <div className="text-[11px] text-slate-500">more</div>
          </button>
        )}
      </div>
    </section>
  );
};
