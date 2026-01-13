import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapPreview } from './MapPreview';
import { MapExpandedView } from './MapExpandedView';

interface LocationMapCardProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  locationText: string;
  /** Show owner-only empty state prompt */
  showOwnerPrompt?: boolean;
}

/**
 * Unified location map card used by both Course Details and Business Profile.
 * Card-style with rounded corners, meta footer, and tap-to-expand behavior.
 */
export const LocationMapCard: React.FC<LocationMapCardProps> = ({
  lat,
  lng,
  name,
  locationText,
  showOwnerPrompt = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Validate coordinates
  const hasValidCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasValidCoords) {
    if (showOwnerPrompt) {
      return (
        <div className="p-4 rounded-sq-md bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sq-sm bg-slate-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Add your address to enable the map</p>
              <p className="text-xs text-slate-500">Your location helps golfers find you</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Map card - identical styling for Course and Business */}
      <button 
        type="button"
        key={`map-${lat}-${lng}`}
        className="relative w-full rounded-sq-md overflow-hidden border border-slate-200 cursor-pointer group text-left"
        onClick={() => setExpanded(true)}
        aria-label={`Expand map for ${name}`}
      >
        <MapPreview
          lat={lat}
          lng={lng}
          name={name}
          height={200}
          showExpandButton={true}
          onExpand={() => setExpanded(true)}
        />
        
        {/* Location meta footer */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">{locationText}</span>
          </div>
        </div>
      </button>

      {/* Unified expanded view */}
      <MapExpandedView
        open={expanded}
        onOpenChange={setExpanded}
        lat={lat}
        lng={lng}
        name={name}
        locationText={locationText}
      />
    </>
  );
};

export default LocationMapCard;
