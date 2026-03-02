import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapPreview } from './MapPreview';
import { MapExpandedView } from './MapExpandedView';

interface LocationMapCardProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  locationText: string;
  showOwnerPrompt?: boolean;
  colorful?: boolean;
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
  colorful = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const hasValidCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasValidCoords) {
    if (showOwnerPrompt) {
      return (
        <div className="p-4 rounded-sq-md bg-muted border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sq-sm bg-secondary flex items-center justify-center">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Add your address to enable the map</p>
              <p className="text-xs text-muted-foreground">Your location helps golfers find you</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        key={`map-${lat}-${lng}`}
        className="relative w-full rounded-sq-md overflow-hidden border border-border shadow-sm cursor-pointer group text-left active:scale-[0.99]"
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(true);
          }
        }}
        aria-label={`Expand map for ${name}`}
      >
        <MapPreview
          lat={lat}
          lng={lng}
          name={name}
          height={200}
          showExpandButton={true}
          onExpand={() => setExpanded(true)}
          colorful={colorful}
          locationText={locationText}
        />
      </div>

      <MapExpandedView
        open={expanded}
        onOpenChange={setExpanded}
        lat={lat}
        lng={lng}
        name={name}
        locationText={locationText}
        colorful={colorful}
      />
    </>
  );
};

export default LocationMapCard;
