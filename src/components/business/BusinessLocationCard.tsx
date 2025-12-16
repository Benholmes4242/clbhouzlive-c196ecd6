import React from 'react';
import { LocationMapCard } from '@/components/map';
import { getCityCountry } from '@/lib/locationDisplay';

interface BusinessLocationCardProps {
  location: string;
  lat?: number | null;
  lng?: number | null;
  businessName: string;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  isOwner?: boolean;
}

/**
 * Business location card - thin wrapper around unified LocationMapCard.
 */
export function BusinessLocationCard({
  location,
  lat,
  lng,
  businessName,
  city,
  country,
  region,
  isOwner = false,
}: BusinessLocationCardProps) {
  const displayLocation = getCityCountry({ city, region, country, location }) || location;

  return (
    <div className="mt-4">
      <LocationMapCard
        lat={lat}
        lng={lng}
        name={businessName}
        locationText={displayLocation}
        showOwnerPrompt={isOwner}
      />
    </div>
  );
}
