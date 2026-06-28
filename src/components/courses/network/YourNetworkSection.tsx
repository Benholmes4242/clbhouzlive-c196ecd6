import React from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNetworkActivity } from '@/hooks/useNetworkActivity';
import { NetworkHighlightCarousel } from './NetworkHighlightCarousel';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface YourNetworkSectionProps {
  className?: string;
}

/**
 * Played by your network — course-discovery row driven by friend-played signal.
 *
 * Sits on the Courses Explore tab. Friends are treated as a discovery signal
 * for courses, not as a destination. No avatar strip, no rounds-this-month
 * stat, no "View all" entry into a friend-activity destination — those framings
 * elevated the social layer above the product layer.
 *
 * Renders nothing when the user has no friends or no network-played highlights.
 */
export const YourNetworkSection: React.FC<YourNetworkSectionProps> = ({ className }) => {
  const { user } = useSupabaseSession();
  const { data, isLoading } = useNetworkActivity(user?.id);

  if (!user || isLoading) return null;
  if (!data?.hasFriends) return null;
  if (!data?.highlights || data.highlights.length === 0) return null;

  return (
    <section
      className={cn(
        'mb-5 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300',
        className,
      )}
    >
      <SectionHeader
        role="section"
        kicker="YOUR CIRCLE"
        title="Courses played by friends"
        paddingX={16}
        className="mb-2"
      />

      <NetworkHighlightCarousel highlights={data.highlights} />
    </section>
  );
};

export default YourNetworkSection;
