import React from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE} from '@/components/ui/SquircleAvatar';
import { formatRelativeAgo } from '@/i18n/format';

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

// Local timeAgo removed in Wave 1 — output now routes through
// `formatRelativeAgo` in `@/i18n/format` (byte-identical en: "just now"
// / "{m}m ago" / "{h}h ago" / "{d}d ago" / … — the previous "yesterday"
// bucket was never emitted here so it stays off).
const timeAgo = (timestamp: string): string => formatRelativeAgo(timestamp);


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
              hairlineRing
              ringColor={LIGHT_HAIRLINE}
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
