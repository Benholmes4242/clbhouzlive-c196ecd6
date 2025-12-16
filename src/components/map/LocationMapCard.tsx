import React, { useRef, useState } from 'react';
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

  // Prevent accidental open when user is scrolling (esp. iOS Safari)
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const openExpanded = () => setExpanded(true);

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
      <div
        key={`map-${lat}-${lng}`}
        className="relative w-full rounded-sq-md overflow-hidden border border-slate-200 cursor-pointer group"
        role="button"
        tabIndex={0}
        onClick={openExpanded}
        onPointerDown={(e) => {
          downRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = downRef.current;
          downRef.current = null;
          if (!start) return openExpanded();
          const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
          if (dist < 10) openExpanded();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openExpanded();
          }
        }}
      >
        <MapPreview
          lat={lat}
          lng={lng}
          name={name}
          height={200}
          showExpandButton={true}
          onExpand={openExpanded}
        />

        {/* Location meta footer */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">{locationText}</span>
          </div>
        </div>
      </div>

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
