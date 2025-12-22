import React from 'react';
import { cn } from '@/lib/utils';
import { Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CommunityEmptyStateProps {
  variant: 'no-community' | 'quiet';
  className?: string;
}

/**
 * CommunityEmptyState - Phase 5 empty states for Community tab
 * 
 * A) no-community: User has no friends/follows
 *    "Your Community is empty" with CTAs
 * 
 * B) quiet: Has friends/follows but no recent posts
 *    Soft nudge to be the first to post
 */
export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({
  variant,
  className,
}) => {
  const navigate = useNavigate();

  if (variant === 'no-community') {
    return (
      <div className={cn("px-5 py-16 text-center", className)}>
        <div className="max-w-sm mx-auto">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-alt/60 flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          
          {/* Message */}
          <h3 className="text-lg font-serif text-foreground">
            Your Community is empty
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Follow golfers or connect with friends to see posts here.
          </p>
          
          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              onClick={() => navigate('/friends')}
              className="px-5"
            >
              Find friends
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/discover?main=shorts')}
              className="px-5"
            >
              Discover golfers
            </Button>
          </div>
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
