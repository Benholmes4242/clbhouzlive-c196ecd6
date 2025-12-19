import React from 'react';
import { cn } from '@/lib/utils';
import { Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FollowingEmptyStateProps {
  variant: 'no-following' | 'no-posts';
  className?: string;
}

/**
 * FollowingEmptyState - Phase 4 empty states
 * 
 * A) User follows no one:
 *    "Follow golfers, clubs, and creators to see their latest moments here."
 * 
 * B) No new posts yet:
 *    "Nothing new yet. Check back soon."
 * 
 * No filler content. Subtle, never pushy.
 */
export const FollowingEmptyState: React.FC<FollowingEmptyStateProps> = ({
  variant,
  className,
}) => {
  const navigate = useNavigate();

  if (variant === 'no-following') {
    return (
      <div className={cn("px-5 py-16 text-center", className)}>
        <div className="max-w-sm mx-auto">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          
          {/* Message */}
          <h3 className="text-lg font-serif text-foreground">
            Your feed is empty
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Follow golfers, clubs, and creators to see their latest moments here.
          </p>
          
          {/* CTA - subtle, secondary style */}
          <div className="mt-8">
            <button
              onClick={() => navigate('/discover?main=shorts')}
              className="py-2.5 px-5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg text-sm text-foreground transition-colors"
            >
              Discover golfers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // no-posts variant
  return (
    <div className={cn("px-5 py-16 text-center", className)}>
      <div className="max-w-sm mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        
        {/* Message */}
        <h3 className="text-lg font-serif text-foreground">
          Nothing new yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Check back soon for updates from people you follow.
        </p>
      </div>
    </div>
  );
};

export default FollowingEmptyState;
