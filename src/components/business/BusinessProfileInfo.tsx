import React from 'react';
import { Phone, Mail, Globe, MapPin, Building2, BadgeCheck, Calendar, Flag, CircleDot, ShoppingBag, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';

interface BusinessProfileInfoProps {
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

export function BusinessProfileInfo({ business }: BusinessProfileInfoProps) {
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

  // Placeholder highlights
  const highlights = [
    business.category,
    '18-hole course',
    'Driving range',
    'Pro shop',
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {/* About - Full text without truncation */}
      {business.description && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">About</h2>
          <p className="text-sm text-muted-foreground leading-[1.7] whitespace-pre-wrap">
            {business.description}
          </p>
        </section>
      )}

      {/* Contact */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <div className="space-y-3">
          {business.phone && (
            <button 
              onClick={handleCall}
              className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-sq-sm p-2 -m-2 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{business.phone}</p>
                <p className="text-xs text-muted-foreground">Phone</p>
              </div>
            </button>
          )}
          
          {business.email && (
            <button 
              onClick={handleEmail}
              className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-sq-sm p-2 -m-2 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{business.email}</p>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
            </button>
          )}
          
          {business.website && (
            <button 
              onClick={handleWebsite}
              className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-sq-sm p-2 -m-2 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </p>
                <p className="text-xs text-muted-foreground">Website</p>
              </div>
            </button>
          )}

          {!business.phone && !business.email && !business.website && (
            <p className="text-sm text-muted-foreground italic">No contact information available.</p>
          )}
        </div>
      </section>

      {/* Location */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Location</h2>
        {business.location ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{business.location}</p>
                <p className="text-xs text-muted-foreground">Address</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleDirections} 
              className="rounded-full w-full sm:w-auto"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Get directions
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No location information available.</p>
        )}
      </section>

      {/* Highlights */}
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

      {/* Business Details */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Business Details</h2>
        <div className="space-y-3">
          {business.category && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{business.category}</p>
                <p className="text-xs text-muted-foreground">Category</p>
              </div>
            </div>
          )}
          
          {business.is_verified && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Verified Business</p>
                <p className="text-xs text-muted-foreground">This business has been verified by Clbhouz</p>
              </div>
            </div>
          )}
          
          {business.created_at && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(business.created_at), 'MMMM yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">Member since</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
