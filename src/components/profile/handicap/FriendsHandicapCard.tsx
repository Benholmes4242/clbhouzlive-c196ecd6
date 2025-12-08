import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Pill } from '@/components/ui/pill';
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
    <section className="bg-muted border border-border rounded-sq-md p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Friends This Month</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare handicap changes with friends
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-sq-pill">
          By Handicap Change
        </span>
      </div>

      {/* Time filter pills */}
      <div className="flex gap-2 mb-4">
        {timeFilters.map(({ key, label }) => (
          <Pill
            key={key}
            size="sm"
            active={timeFilter === key}
            onClick={() => setTimeFilter(key)}
          >
            {label}
          </Pill>
        ))}
      </div>

      {/* Friends list */}
      <ul className="divide-y divide-border">
        {adjustedFriends.slice(0, 5).map((friend, idx) => (
          <li key={friend.id} className="flex items-center gap-3 py-3">
            <span className="w-5 text-sm font-semibold text-muted-foreground">
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
                friend.delta > 0 ? 'text-red-500' : 'text-muted-foreground'
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
    </section>
  );
};

export default FriendsHandicapCard;
