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
 * Your Network Section - Social-discovery surface
 * 
 * Sits directly on page background (no card wrapper) with:
 * - Header row with title, "Last 30 days" label, and "View all" action (slate, not orange)
 * - Avatar strip (conditional: >= 3 friends, no colored rings)
 * - Network pulse copy (dynamic insights)
 * - Network highlight carousel (landscape tiles)
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
        'mb-5 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">
          Your Network
        </h2>
        <button
          onClick={handleViewAll}
          className="py-2.5 px-1 text-sm text-muted-foreground font-medium hover:text-foreground active:scale-[0.97] transition-all"
        >
          View all ›
        </button>
      </div>

      {/* Avatar Strip (conditional: >= 3 friends) */}
      <NetworkAvatarStrip friends={friends} />

      {/* Network Pulse Copy */}
      {!showEmptyActivityState ? (
        <NetworkPulseCopy pulse={pulse} friends={friends} />
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your network is quiet this month
        </p>
      )}

      {/* Network Highlight Carousel */}
      {highlights.length > 0 ? (
        <NetworkHighlightCarousel highlights={highlights} />
      ) : (
        // Fallback for no highlights: Show subtle CTA
        friends.length < 3 && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Add friends to see their activity
            </p>
          </div>
        )
      )}
    </section>
  );
};

export default YourNetworkSection;
