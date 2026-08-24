import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { MapPreview } from './MapPreview';
import { MapExpandedView, type MapExpandedViewNearbyPin } from './MapExpandedView';

interface LocationMapCardProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  locationText: string;
  showOwnerPrompt?: boolean;
  colorful?: boolean;
  nearby?: MapExpandedViewNearbyPin[];
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
  nearby,
}) => {
  const [expanded, setExpanded] = useState(false);

  const hasValidCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasValidCoords) {
    if (showOwnerPrompt) {
      return (
        <div className="p-4 rounded-sq-md bg-muted border border-border/10">
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
        key={`map-${lat}-${lng}`}
        style={{
          background: '#1B1E27',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Map - overlays removed; tap to expand */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Expand map for ${name}`}
          onClick={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded(true);
            }
          }}
          style={{ cursor: 'pointer' }}
          className="active:opacity-[0.96]"
        >
          <MapPreview
            lat={lat}
            lng={lng}
            name={name}
            height={170}
            showExpandButton={false}
            colorful={colorful}
          />
        </div>
        {/* Footer rail — analytical treatment: no tinted tiles or pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
          <MapPin size={14} strokeWidth={2} color="rgba(255,255,255,0.66)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {locationText}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'transparent', color: 'rgba(255,255,255,0.66)',
              border: 'none', padding: '8px 0', minHeight: 44,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <Navigation size={12} strokeWidth={2.2} />
            Directions
          </button>
        </div>

      </div>

      <MapExpandedView
        open={expanded}
        onOpenChange={setExpanded}
        lat={lat}
        lng={lng}
        name={name}
        locationText={locationText}
        colorful={colorful}
        nearby={nearby}
      />
    </>
  );
};

export default LocationMapCard;
