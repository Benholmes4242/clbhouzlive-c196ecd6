import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  courseName: string;
  timestamp: string;
}

interface FriendsActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

const timeAgo = (timestamp: string): string => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const FriendsActivityFeed: React.FC<FriendsActivityFeedProps> = ({
  activities,
  maxItems = 3,
}) => {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Friend Activity
      </h4>
      <div className="space-y-2">
        {activities.slice(0, maxItems).map((activity) => (
          <div 
            key={activity.id}
            className="flex items-center gap-3 p-2 rounded-sq-sm bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <SquircleAvatar
              src={activity.userAvatar}
              alt={activity.userName}
              userId={activity.userId}
              size={32}
              hideRing
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.userName}</span>
                {' logged '}
                <span className="font-medium text-primary">{activity.courseName}</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
