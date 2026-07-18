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
        key={`map-${lat}-${lng}`}
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(15,23,42,0.07)',
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
        {/* Footer rail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'rgba(247,147,30,0.10)', color: '#F7931E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={16} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {locationText}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
              Tap map to explore
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(247,147,30,0.10)', color: '#F7931E',
              border: 'none', borderRadius: 999, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Navigation size={13} strokeWidth={2.2} />
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
