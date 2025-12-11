import React, { useState } from 'react';
import { MapPin, Star, Image as ImageIcon, Flag, CircleDot, ShoppingBag, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { motion, AnimatePresence } from 'framer-motion';
import { InsightsMiniStrip } from './InsightsMiniStrip';
import { FeaturedVideoBlock } from './FeaturedVideoBlock';

interface BusinessProfileOverviewProps {
  business: BusinessProfile;
  membership?: BusinessMembership | null;
}

// Icons for common highlights
const HIGHLIGHT_ICONS: Record<string, typeof Flag> = {
  '18-hole course': Flag,
  '9-hole course': Flag,
  'Driving range': CircleDot,
  'Pro shop': ShoppingBag,
  'Practice facilities': Grip,
};

export function BusinessProfileOverview({ business, membership }: BusinessProfileOverviewProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const MAX_CHARS = 200;
  const hasLongDescription = (business.description?.length ?? 0) > MAX_CHARS;
  const displayDescription = showFullDescription 
    ? business.description 
    : business.description?.slice(0, MAX_CHARS);

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Placeholder highlights - these would come from a facilities field later
  const highlights = [
    business.category,
    '18-hole course',
    'Driving range',
    'Pro shop',
  ].filter(Boolean);

  const isOwner = membership?.canManage || false;

  return (
    <div className="space-y-8">
      {/* Insights Mini-Strip - Owner only */}
      {isOwner && (
        <InsightsMiniStrip
          businessId={business.id}
          visits7d={127}
          followersGained={12}
          postImpressions={458}
        />
      )}

      {/* Featured Video Block */}
      <FeaturedVideoBlock
        videoUrl={null} // TODO: Add featured_video_url to business profile
        posterUrl={null}
        businessName={business.name}
        isOwner={isOwner}
        onEditClick={() => console.log('Edit featured video')}
      />

      {/* About section - Soft panel style (no card border) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">About</h2>
        {business.description ? (
          <div>
            <p className="text-sm text-muted-foreground leading-[1.7] whitespace-pre-wrap">
              {displayDescription}
              {hasLongDescription && !showFullDescription && '...'}
            </p>
            {hasLongDescription && (
              <AnimatePresence>
                <motion.button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm font-medium text-primary hover:underline mt-2 inline-block"
                  whileTap={{ scale: 0.98 }}
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </motion.button>
              </AnimatePresence>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description available.</p>
        )}
      </section>

      {/* Highlights - Chip row (no card container) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Highlights</h2>
        <div className="flex flex-wrap gap-2">
          {highlights.map((highlight, idx) => {
            const Icon = HIGHLIGHT_ICONS[highlight as string] || Flag;
            return (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {highlight}
              </span>
            );
          })}
        </div>
      </section>

      {/* Location - Soft section with map placeholder */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Location</h2>
        {business.location ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{business.location}</p>
            
            {/* Map placeholder - modern gradient panel */}
            <div className="h-[160px] rounded-sq-md bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border border-border/30">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Map coming soon</p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleDirections} 
                className="rounded-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get directions
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No location information available.</p>
        )}
      </section>

      {/* Photos - Soft section */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Photos</h2>
        <div className="flex items-center gap-3 py-6">
          <p className="text-sm text-muted-foreground">
            No photos yet – post as {business.name} to add some.
          </p>
        </div>
      </section>

      {/* Reviews - Soft section with coming soon */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Reviews</h2>
        <p className="text-sm text-muted-foreground py-4">
          Coming soon – you'll be able to see what golfers are saying about this business.
        </p>
      </section>
    </div>
  );
}
