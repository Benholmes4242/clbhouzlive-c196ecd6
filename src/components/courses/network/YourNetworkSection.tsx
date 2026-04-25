import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Your Network</span>
          </div>
          {showEmptyActivityState ? (
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              Your Network
            </h2>
          ) : (
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              {pulse.total_rounds} {pulse.total_rounds === 1 ? 'round' : 'rounds'} this month
            </h2>
          )}
        </div>
        <button
          onClick={handleViewAll}
          className="py-2.5 px-1 text-[13px] text-muted-foreground font-medium active:scale-[0.97] active:opacity-70 transition-all flex items-center gap-0.5"
        >
          View all
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Avatar Strip (conditional: >= 3 friends) */}
      <NetworkAvatarStrip friends={friends} />

      {/* Meta byline (replaces NetworkPulseCopy — orphaned, kept for future cleanup) */}
      {!showEmptyActivityState ? (
        <p style={{
          fontSize: 11, color: '#64748B', margin: '10px 0 0',
          fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          {pulse.active_friends} ACTIVE · {pulse.new_courses_discovered} COURSES · LAST 30 DAYS
        </p>
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
          <div className="mt-3 p-3 rounded-xl bg-card border border-border/50 text-center">
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
