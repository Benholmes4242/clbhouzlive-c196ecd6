import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
}

/** Reusable info row with icon circle, value, and label */
function InfoRow({ 
  icon: Icon, 
  value, 
  label, 
  onClick 
}: { 
  icon: React.ElementType; 
  value: string; 
  label: string; 
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { onClick } : {})}
      className={`flex items-center gap-3 w-full text-left rounded-lg p-2.5 min-h-[44px] transition-colors ${
        onClick ? 'active:scale-[0.98] transition-transform hover:bg-muted/60 cursor-pointer' : ''
      }`}
    >
      <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Wrapper>
  );
}

export function BusinessProfileInfo({ business }: BusinessProfileInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const MAX_LINES = 3;
  const MAX_CHARS = 180; // ~3 lines at typical width
  const hasLongDescription = (business.description?.length ?? 0) > MAX_CHARS;
  const displayDescription = showFullDescription
    ? business.description
    : business.description?.slice(0, MAX_CHARS);

  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleEmail = () => {
    if (business.email) {
      window.location.href = `mailto:${business.email}`;
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http')
        ? business.website
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <div className="-mx-5 px-0 bg-muted/40">
      <div className="flex flex-col gap-3">
        {/* About — no heading since the tab label "About" provides context */}
        {business.description && (
          <section className="bg-card p-4 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground leading-[1.7] whitespace-pre-wrap">
                {displayDescription}
                {hasLongDescription && !showFullDescription && '...'}
              </p>
              {hasLongDescription && (
                <AnimatePresence>
                  <motion.button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-sm font-medium text-primary hover:underline mt-2 inline-block min-h-[44px] flex items-center active:opacity-70"
                    whileTap={{ scale: 0.98 }}
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </motion.button>
                </AnimatePresence>
              )}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="bg-card p-4 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <div className="space-y-1">
            {business.phone && (
              <InfoRow icon={Phone} value={business.phone} label="Phone" onClick={handleCall} />
            )}
            {business.email && (
              <InfoRow icon={Mail} value={business.email} label="Email" onClick={handleEmail} />
            )}
            {business.website && (
              <InfoRow
                icon={Globe}
                value={business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                label="Website"
                onClick={handleWebsite}
              />
            )}
            {!business.phone && !business.email && !business.website && (
              <p className="text-sm text-muted-foreground italic">No contact information available.</p>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="bg-card p-4 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Location</h2>
          {business.location ? (
            <div className="space-y-4">
              <InfoRow icon={MapPin} value={business.location} label="Address" />

              <Button
                variant="outline"
                onClick={handleDirections}
                className="rounded-full w-full sm:w-auto text-foreground border-border hover:bg-muted min-h-[44px] active:scale-[0.97] transition-transform"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get directions
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No location information available.</p>
          )}
        </section>

        {/* Business Details */}
        <section className="bg-card p-4 space-y-3 pb-8">
          <h2 className="text-base font-semibold text-foreground">Business Details</h2>
          <div className="space-y-1">
            {business.category && (
              <InfoRow icon={Building2} value={business.category} label="Category" />
            )}

            {business.is_verified && (
              <div className="flex items-center gap-3 p-2.5 min-h-[44px]">
                <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <VerifiedBadge size="lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Verified Business</p>
                  <p className="text-xs text-muted-foreground">This business has been verified by clbhouz</p>
                </div>
              </div>
            )}

            {business.created_at && (
              <InfoRow
                icon={Calendar}
                value={format(new Date(business.created_at), 'MMMM yyyy')}
                label="Member since"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
