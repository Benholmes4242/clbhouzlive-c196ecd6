import React from 'react';
import { cn } from '@/lib/utils';
import { Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CommunityEmptyStateProps {
  variant: 'no-community' | 'quiet' | 'no-results';
  className?: string;
  onClearFilter?: () => void;
}

/**
 * CommunityEmptyState - Empty states for Community tab
 * 
 * A) no-community: User has no friends/follows
 *    "Your Community is empty" with CTAs
 * 
 * B) quiet: Has friends/follows but no recent posts
 *    Soft nudge to be the first to post
 * 
 * C) no-results: Filter/search returned nothing
 *    "No posts yet" with Clear filters button
 */
export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({
  variant,
  className,
  onClearFilter,
}) => {
  const navigate = useNavigate();

  if (variant === 'no-community') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-6", className)}>
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        
        {/* Message */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Your Community is empty
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-[260px] mb-6">
          Follow golfers or connect with friends to see their posts here
        </p>
        
        {/* CTA */}
        <Button
          variant="outline"
          onClick={() => navigate('/golferstofollow')}
        >
          Discover golfers
        </Button>
      </div>
    );
  }

  // no-results variant - filter/search returned nothing
  if (variant === 'no-results') {
    return (
      <div className={cn("px-5 py-16 text-center", className)}>
        <div className="max-w-sm mx-auto">
          <h3 className="text-base font-medium text-foreground">
            No posts yet
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Try another filter or search.
          </p>
          {onClearFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilter}
              className="mt-4"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // quiet variant - soft nudge
  return (
    <div className={cn("px-5 py-10 text-center", className)}>
      <div className="max-w-sm mx-auto bg-muted/30 rounded-lg px-6 py-5">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <p className="text-sm">
            Your community's been quiet — be the first to post today.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/create-moment')}
          className="mt-3 text-primary"
        >
          Share a moment
        </Button>
      </div>
    </div>
  );
};

export default CommunityEmptyState;
