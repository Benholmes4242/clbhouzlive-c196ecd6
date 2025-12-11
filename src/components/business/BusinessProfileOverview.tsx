import React, { useState } from 'react';
import { MapPin, Star, Image as ImageIcon, Flag, CircleDot, ShoppingBag, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessProfileOverviewProps {
  business: BusinessProfile;
}

// Icons for common highlights
const HIGHLIGHT_ICONS: Record<string, typeof Flag> = {
  '18-hole course': Flag,
  '9-hole course': Flag,
  'Driving range': CircleDot,
  'Pro shop': ShoppingBag,
  'Practice facilities': Grip,
};

export function BusinessProfileOverview({ business }: BusinessProfileOverviewProps) {
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

  return (
    <div className="space-y-6">
      {/* About section */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">About</h2>
        {business.description ? (
          <div>
            <p className="text-muted-foreground leading-[1.7] whitespace-pre-wrap">
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
          <p className="text-muted-foreground italic">No description available.</p>
        )}
      </section>

      {/* Key Highlights */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">Highlights</h2>
        <div className="flex flex-wrap gap-2">
          {highlights.map((highlight, idx) => {
            const Icon = HIGHLIGHT_ICONS[highlight as string] || Flag;
            return (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sq-pill bg-muted text-sm text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {highlight}
              </span>
            );
          })}
        </div>
      </section>

      {/* Location / Map */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">Location</h2>
        {business.location ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-foreground font-medium">{business.location}</p>
            </div>
            
            {/* Map placeholder - modern gradient box */}
            <div className="h-[180px] rounded-sq-sm bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border border-border/50">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Map coming soon</p>
            </div>
            
            <Button 
              variant="secondary" 
              onClick={handleDirections} 
              className="w-full md:w-auto rounded-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Get directions
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No location information available.</p>
        )}
      </section>

      {/* Featured photos placeholder */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">Photos</h2>
        <div className="flex items-center gap-3 text-muted-foreground">
          <ImageIcon className="h-10 w-10 opacity-50" />
          <p className="text-sm">
            Add photos by posting as this business.
          </p>
        </div>
      </section>

      {/* Featured review placeholder */}
      <section className="bg-card border border-border rounded-sq-md p-4 md:p-6">
        <div className="flex items-start gap-3">
          <Star className="h-10 w-10 text-muted-foreground opacity-50" />
          <div>
            <h2 className="text-lg font-semibold mb-1">Reviews</h2>
            <p className="text-sm text-muted-foreground">
              Coming soon – you'll be able to see what golfers are saying about this business.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
