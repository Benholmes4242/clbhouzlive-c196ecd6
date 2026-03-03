import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Calendar, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useNavigate } from 'react-router-dom';

const BIO_CHAR_LIMIT = 200;

function BioText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > BIO_CHAR_LIMIT;
  const displayText = !expanded && shouldTruncate ? text.slice(0, BIO_CHAR_LIMIT).trimEnd() + '…' : text;

  return (
    <div>
      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-[0.8125rem] font-medium text-muted-foreground mt-1 min-h-[44px] active:scale-95 transition-transform"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

interface BusinessProfileInfoProps {
  business: BusinessProfile;
  canManage?: boolean;
}

export function BusinessProfileInfo({ business, canManage }: BusinessProfileInfoProps) {
  const navigate = useNavigate();

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
    <div className="-mx-5 px-0 pb-8 bg-background">
      <div className="flex flex-col gap-3">
        {/* About — tab label provides heading, body text starts immediately */}
        {business.description && (
          <section className="p-4 space-y-3">
            {canManage && (
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/business/${business.id}/edit`)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground active:opacity-70 transition-opacity"
                  aria-label="Edit business info"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <BioText text={business.description} />
          </section>
        )}

        {/* Contact */}
        <section className="p-4 space-y-3">
          <h2 className="text-[17px] font-semibold text-foreground">Contact</h2>
          <div className="space-y-2">
            {business.phone && (
              <button 
                onClick={handleCall}
                className="flex items-center gap-3 w-full text-left hover:bg-muted rounded-sq-sm p-2.5 min-h-[44px] active:scale-[0.98] transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{business.phone}</p>
                  <p className="text-xs text-muted-foreground">Phone</p>
                </div>
              </button>
            )}
            
            {business.email && (
              <button 
                onClick={handleEmail}
                className="flex items-center gap-3 w-full text-left hover:bg-muted rounded-sq-sm p-2.5 min-h-[44px] active:scale-[0.98] transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{business.email}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </button>
            )}
            
            {business.website && (
              <button 
                onClick={handleWebsite}
                className="flex items-center gap-3 w-full text-left hover:bg-muted rounded-sq-sm p-2.5 min-h-[44px] active:scale-[0.98] transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
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
        <section className="p-4 space-y-3">
          <h2 className="text-[17px] font-semibold text-foreground">Location</h2>
          {business.location ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{business.location}</p>
                  <p className="text-xs text-muted-foreground">Address</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleDirections} 
                className="h-11 rounded-full w-full sm:w-auto text-foreground border-border hover:bg-muted active:scale-[0.97] transition-all font-semibold"
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
        <section className="p-4 space-y-3">
          <h2 className="text-[17px] font-semibold text-foreground">Business Details</h2>
          <div className="space-y-2">
            {business.category && (
              <div className="flex items-center gap-3 p-2.5 min-h-[44px]">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{business.category}</p>
                  <p className="text-xs text-muted-foreground">Category</p>
                </div>
              </div>
            )}
            
            {business.is_verified && (
              <div className="flex items-center gap-3 p-2.5 min-h-[44px]">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <VerifiedBadge size="lg" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Verified Business</p>
                  <p className="text-xs text-muted-foreground">This business has been verified by clbhouz</p>
                </div>
              </div>
            )}
            
            {business.created_at && (
              <div className="flex items-center gap-3 p-2.5 min-h-[44px]">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(new Date(business.created_at), 'MMMM yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Member since</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
