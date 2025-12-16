import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';

interface BusinessLocationCardExpandableProps {
  addressLabel: string;
  lat: number;
  lng: number;
  businessName: string;
  precision?: string;
  className?: string;
}

// Mapbox public token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTVyejIzMXcxemx2MmpzZDU3YjkxNjNkIn0.H_w9d-UAvvMRkJ_9DoVQ-A';

// Apple Maps icon
const AppleMapsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

// Google Maps icon
const GoogleMapsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.26.56.48 1.15.7 1.7.15.37.27.73.42 1.08.03.07.07.13.14.13.07 0 .11-.06.14-.13.15-.35.27-.71.42-1.08.22-.55.44-1.14.7-1.7.36-.81.7-1.51 1.17-2.26.96-1.54 2.21-2.86 3.16-4.4C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z"/>
    <circle fill="#FFFFFF" cx="12" cy="9" r="2.5"/>
  </svg>
);

export const BusinessLocationCardExpandable: React.FC<BusinessLocationCardExpandableProps> = ({
  addressLabel,
  lat,
  lng,
  businessName,
  precision,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Generate static map URL for thumbnail
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+F7931E(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`;

  // Initialize interactive map when expanded
  useEffect(() => {
    if (!isExpanded || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Add marker
    new mapboxgl.Marker({ color: '#F7931E' })
      .setLngLat([lng, lat])
      .addTo(map.current);

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      // Don't destroy map on cleanup to avoid re-initialization costs
    };
  }, [isExpanded, lat, lng]);

  // Resize map when container becomes visible
  useEffect(() => {
    if (isExpanded && map.current && mapLoaded) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isExpanded, mapLoaded]);

  // Open Apple Maps
  const openAppleMaps = () => {
    const encodedLabel = encodeURIComponent(`${businessName}, ${addressLabel}`);
    // Try native maps:// first, fallback to web
    const nativeUrl = `maps://?q=${encodedLabel}&ll=${lat},${lng}`;
    const webUrl = `https://maps.apple.com/?q=${encodedLabel}&ll=${lat},${lng}`;
    
    // Check if we're on iOS/macOS
    const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
    window.open(isAppleDevice ? nativeUrl : webUrl, '_blank');
  };

  // Open Google Maps
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const isApproximate = precision && !['address', 'poi', 'pin'].includes(precision);

  return (
    <div className={cn("rounded-sq-md border bg-card overflow-hidden", className)}>
      {/* Clickable header/thumbnail */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        {/* Static map thumbnail */}
        <div className="relative w-full h-[140px] bg-muted">
          <img
            src={staticMapUrl}
            alt={`Map of ${businessName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Tap to expand overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Tap to expand
              </>
            )}
          </div>
        </div>

        {/* Address label */}
        <div className="px-4 py-3 flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{addressLabel}</p>
            {isApproximate && (
              <p className="text-xs text-amber-600 mt-0.5">Approximate location</p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded state */}
      {isExpanded && (
        <div className="border-t">
          {/* Interactive map */}
          <div ref={mapContainer} className="w-full h-[250px]" />

          {/* Map app buttons */}
          <div className="px-4 py-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={openAppleMaps}
            >
              <AppleMapsIcon />
              <span className="ml-2">Apple Maps</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={openGoogleMaps}
            >
              <GoogleMapsIcon />
              <span className="ml-2">Google Maps</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessLocationCardExpandable;
