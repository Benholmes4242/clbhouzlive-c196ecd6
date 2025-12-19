/**
 * InfoHeroIdentity - Full-width hero with dark gradient, name, verified badge, city pill
 */
import React from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { MapPin } from 'lucide-react';
import { getCityOnly } from '@/lib/locationDisplay';

interface InfoHeroIdentityProps {
  business: BusinessProfile;
}

export function InfoHeroIdentity({ business }: InfoHeroIdentityProps) {
  const city = getCityOnly({ city: business.city, location: business.location });
  const heroImage = business.cover_image_url || '/placeholder.svg';

  return (
    <div className="relative w-full h-[220px] -mx-4 overflow-hidden">
      {/* Hero image */}
      <img
        src={heroImage}
        alt={business.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.85) 100%)'
        }}
      />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
        {/* Business name + verified */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {business.name}
          </h1>
          {business.is_verified && (
            <VerifiedBadge size="md" className="flex-shrink-0" />
          )}
        </div>
        
        {/* City pill */}
        {city && (
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.95)'
            }}
          >
            <MapPin className="h-3 w-3" />
            {city}
          </div>
        )}
      </div>
    </div>
  );
}
