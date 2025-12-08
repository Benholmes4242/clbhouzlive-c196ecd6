import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FriendHandicapEntry } from '@/lib/mockHandicapData';

interface FriendsHandicapCardProps {
  friends: FriendHandicapEntry[];
}

type TimeFilter = '1m' | '3m' | '12m';

const FriendsHandicapCard: React.FC<FriendsHandicapCardProps> = ({ friends }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1m');

  // Mock: adjust deltas based on time filter for demo
  const adjustedFriends = friends.map(f => ({
    ...f,
    delta: timeFilter === '3m' ? f.delta * 1.5 : timeFilter === '12m' ? f.delta * 3 : f.delta,
  })).sort((a, b) => a.delta - b.delta); // Best improvement first

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: '1m', label: '1 month' },
    { key: '3m', label: '3 months' },
    { key: '12m', label: '12 months' },
  ];

  return (
    <section className="bg-background border border-border rounded-sq-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Friends This Month</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Compare handicap changes with friends
            </p>
          </div>
          {/* Pill - same style as HCP pill */}
          <span className="text-[10px] font-medium text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-sq-pill whitespace-nowrap">
            By Handicap Change
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Time filter chips - matching journey filters */}
        <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/60 p-1 mb-4">
          {timeFilters.map(({ key, label }) => {
            const isActive = timeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTimeFilter(key)}
                className={[
                  'px-3 py-1.5 text-xs font-medium rounded-sq-pill transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Friends list */}
        <ul className="divide-y divide-border">
          {adjustedFriends.slice(0, 5).map((friend, idx) => (
            <li key={friend.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {/* Position badge */}
              <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted rounded-full">
                {idx + 1}
              </span>
              <SquircleAvatar
                size={40}
                src={friend.avatarUrl}
                alt={friend.name}
                fallback={friend.name.charAt(0).toUpperCase()}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{friend.name}</div>
                {friend.homeClub && (
                  <div className="text-xs text-muted-foreground truncate">{friend.homeClub}</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  friend.delta < 0 ? 'text-emerald-600' : 
                  friend.delta > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {friend.delta > 0 ? '+' : ''}{friend.delta.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {friend.currentIndex.toFixed(1)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FriendsHandicapCard;
