import React from 'react';
import { LocationMapCard } from '@/components/map';
import { getCityCountry } from '@/lib/locationDisplay';
import { MapPin } from 'lucide-react';

interface BusinessLocationCardProps {
  location: string;
  lat?: number | null;
  lng?: number | null;
  businessName: string;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  isOwner?: boolean;
  /** If true, this is a linked golf club - never show "Add address" prompt */
  isLinkedClub?: boolean;
}

/**
 * Business location card - thin wrapper around unified LocationMapCard.
 * For linked golf clubs: shows map from club data, never shows "Add address" prompt.
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
  isLinkedClub = false,
}: BusinessLocationCardProps) {
  const displayLocation = getCityCountry({ city, region, country, location }) || location;
  const hasValidCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  // For linked golf clubs without coords, show a different message (not "Add address")
  if (isLinkedClub && !hasValidCoords) {
    return (
      <div className="mt-4 p-4 rounded-sq-md bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-[#64748b]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Map unavailable for this club record</p>
            <p className="text-xs text-slate-500">Contact support if you need to update location details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <LocationMapCard
        lat={lat}
        lng={lng}
        name={businessName}
        locationText={displayLocation}
        showOwnerPrompt={isOwner && !isLinkedClub}
        colorful
      />
    </div>
  );
}
