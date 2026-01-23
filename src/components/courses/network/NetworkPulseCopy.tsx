import React from 'react';
import { cn } from '@/lib/utils';
import type { NetworkPulseData, NetworkFriend } from '@/hooks/useNetworkActivity';

interface NetworkPulseCopyProps {
  pulse: NetworkPulseData;
  friends: NetworkFriend[];
  className?: string;
}

/**
 * Dynamic, natural-language insight based on network activity.
 * Shows 1-2 lines of ambient insight, not data output.
 */
export const NetworkPulseCopy: React.FC<NetworkPulseCopyProps> = ({
  pulse,
  friends,
  className,
}) => {
  // Edge case: Hide if no activity and fewer than 3 friends
  if (pulse.total_rounds === 0 && friends.length < 3) return null;

  // Generate insight text based on priority logic
  const getInsightText = (): string => {
    const { total_rounds, new_courses_discovered, most_active_region, region_concentration, active_friends } = pulse;

    // Priority 1: Rounds played
    if (total_rounds > 0) {
      return `Your network played ${total_rounds} round${total_rounds === 1 ? '' : 's'} this month`;
    }

    // Priority 2: New courses discovered
    if (new_courses_discovered > 0) {
      return `${new_courses_discovered} new course${new_courses_discovered === 1 ? '' : 's'} discovered by friends`;
    }

    // Priority 3: Regional concentration (60%+)
    if (most_active_region && region_concentration >= 0.6) {
      return `Most active region: ${most_active_region}`;
    }

    // Priority 4: Active friends
    if (active_friends > 0) {
      const activeFriend = friends.find((f) => f.is_active_recently);
      const friendName = activeFriend?.display_name || activeFriend?.username;
      if (friendName && active_friends > 1) {
        return `${friendName} and ${active_friends - 1} other${active_friends > 2 ? 's' : ''} have been busy on the course`;
      }
      if (friendName) {
        return `${friendName} has been active on the course`;
      }
    }

    // Fallback: Minimal/no activity
    return 'See what courses your network is playing';
  };

  const insightText = getInsightText();

  return (
    <div className={cn('mt-3', className)}>
      <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
        {insightText}
      </p>
    </div>
  );
};

export default NetworkPulseCopy;
