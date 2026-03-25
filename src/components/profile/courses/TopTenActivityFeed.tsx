import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTopTenActivity } from '@/hooks/useTopTenActivity';
import { REACTION_CONFIG } from '@/hooks/useTopTenReactions';
import { formatDistanceToNow } from 'date-fns';

interface TopTenActivityFeedProps {
  targetUserId: string;
}

export const TopTenActivityFeed: React.FC<TopTenActivityFeedProps> = ({ targetUserId }) => {
  const { data: items = [], isLoading } = useTopTenActivity(targetUserId);
  if (isLoading || items.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-amber-500" />
        Top 10 Activity
      </h3>
      <div className="space-y-3">
        {items.slice(0, 8).map(item => (
          <div key={item.id} className="flex items-start gap-2.5">
            {item.actor_avatar ? (
              <img src={item.actor_avatar} alt={item.actor_name} className="w-7 h-7 object-cover flex-shrink-0" style={{ borderRadius: '34%' }} />
            ) : (
              <div className="w-7 h-7 bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0" style={{ borderRadius: '34%' }}>
                {item.actor_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-semibold">{item.actor_name}</span>
                {item.type === 'reaction' && item.reaction_type ? (
                  <span>
                    {' '}reacted {REACTION_CONFIG[item.reaction_type as keyof typeof REACTION_CONFIG]?.emoji} to{' '}
                    <span className="font-medium">{item.course_name}</span>
                  </span>
                ) : (
                  <span>
                    {' '}commented on{' '}
                    <span className="font-medium">{item.course_name}</span>
                  </span>
                )}
              </p>
              {item.type === 'comment' && item.body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">"{item.body}"</p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
