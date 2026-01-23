import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNetworkActivity } from '@/hooks/useNetworkActivity';
import { NetworkAvatarStrip } from './NetworkAvatarStrip';
import { NetworkPulseCopy } from './NetworkPulseCopy';
import { NetworkHighlightCarousel } from './NetworkHighlightCarousel';

interface YourNetworkSectionProps {
  className?: string;
}

/**
 * Your Network Section - Premium social-discovery surface
 * 
 * Single cohesive glass container with:
 * - Header row with title, "Last 30 days" label, and "View all" action
 * - Avatar strip (conditional: >= 3 friends)
 * - Network pulse copy (dynamic insights)
 * - Network highlight carousel
 */
export const YourNetworkSection: React.FC<YourNetworkSectionProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data, isLoading } = useNetworkActivity(user?.id);

  // Don't show loading state to prevent layout shift
  if (!user || isLoading) return null;

  // Empty state: No friends at all - hide entire section
  if (!data?.hasFriends) return null;

  const { friends, highlights, pulse, hasActivity } = data;

  const handleViewAll = () => {
    navigate('/friends-activity');
  };

  // Edge case: Friends but no recent activity
  const showEmptyActivityState = !hasActivity && friends.length > 0;

  return (
    <section 
      className={cn(
        'mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {/* Glass container */}
      <div 
        className="mx-4 rounded-2xl p-4 border"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Your Network
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Last 30 days
            </span>
            <button
              onClick={handleViewAll}
              className="text-sm text-primary font-medium hover:underline transition-colors"
            >
              View all ›
            </button>
          </div>
        </div>

        {/* Avatar Strip (conditional: >= 3 friends) */}
        <NetworkAvatarStrip friends={friends} />

        {/* Network Pulse Copy */}
        {!showEmptyActivityState ? (
          <NetworkPulseCopy pulse={pulse} friends={friends} />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Your network is quiet this month
          </p>
        )}

        {/* Network Highlight Carousel */}
        {highlights.length > 0 ? (
          <NetworkHighlightCarousel highlights={highlights} />
        ) : (
          // Fallback for no highlights: Show subtle CTA
          friends.length < 3 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Add friends to see their activity
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default YourNetworkSection;
