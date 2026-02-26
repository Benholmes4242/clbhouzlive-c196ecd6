import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { createGlassyMarkerElement } from './MapMarker';
import { MAP_CONFIG } from '@/config/maps';

interface MapExpandedViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  name: string;
  locationText?: string;
  colorful?: boolean;
}

/**
 * Unified expanded map view used by both Course Details and Business Profile.
 * Features satellite-streets, glassy orange marker, zoom controls, Apple/Google Maps buttons.
 */
export const MapExpandedView: React.FC<MapExpandedViewProps> = ({
  open,
  onOpenChange,
  lat,
  lng,
  name,
  locationText,
  colorful = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Detect iOS for Apple Maps button
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Swipe down to close (header area only)
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => onOpenChange(false),
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  // Deep link URLs
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}&z=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  useEffect(() => {
    mountedRef.current = true;

    // Clean up when closed
    if (!open) {
      if (initTimeoutRef.current != null) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (!MAP_CONFIG.TOKEN) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Recenter if map already exists
    if (mapRef.current) {
      mapRef.current.setCenter([lng, lat]);
      mapRef.current.resize();
      return;
    }

    // Delay init for sheet animation
    initTimeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current || !mapContainerRef.current) return;

      mapboxgl.accessToken = MAP_CONFIG.TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: colorful ? 'mapbox://styles/mapbox/streets-v12' : MAP_CONFIG.STYLE_URL,
        center: [lng, lat],
        zoom: MAP_CONFIG.ZOOM.EXPANDED,
        interactive: true,
        maxZoom: MAP_CONFIG.ZOOM.MAX,
        minZoom: MAP_CONFIG.ZOOM.MIN,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });

      mapRef.current = map;

      // Navigation controls
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

      // Glassy orange marker (xs size)
      const markerEl = createGlassyMarkerElement('sm');
      new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

      map.on('load', () => {
        map.resize();
      });

      map.on('error', (e) => {
        if ((e as any)?.error?.message?.includes('WebGL')) {
          console.error('[MapExpandedView] WebGL error, removing map', e);
          map.remove();
          mapRef.current = null;
        }
      });
    }, 200);

    return () => {
      mountedRef.current = false;
      if (initTimeoutRef.current != null) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, lat, lng]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[80vh] flex flex-col p-0 !rounded-t-2xl"
        hideCloseButton
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Custom close button with 44px tap target */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header - swipe to close area */}
        <div {...swipeHandlers} className="px-4 pt-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {name}
              </h2>
              {locationText && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locationText}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 pb-[calc(max(20px,env(safe-area-inset-bottom,0px))+8px)] gap-4">
          {/* Map - full bleed on mobile, rounded on desktop */}
          <div 
            className="relative h-[calc(100vh-300px)] max-h-[52vh] rounded-none overflow-hidden border border-border/60 sm:border-border/40 bg-surface-alt w-[100vw] left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 sm:rounded-2xl sm:mx-4 expanded-map-glass-controls" 
            style={{ minHeight: `${MAP_CONFIG.HEIGHT.EXPANDED_MIN}px` }}
          >
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 px-4">
            {isIOS && (
              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 shadow-none"
                onClick={() => window.open(appleMapsUrl, '_blank')}
              >
                Open in Apple Maps
              </Button>
            )}
            <Button
              className={isIOS ? "flex-1" : "flex-1 bg-foreground text-background hover:bg-foreground/90"}
              variant={isIOS ? 'outline' : 'default'}
              onClick={() => window.open(googleMapsUrl, '_blank')}
            >
              Open in Google Maps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapExpandedView;
