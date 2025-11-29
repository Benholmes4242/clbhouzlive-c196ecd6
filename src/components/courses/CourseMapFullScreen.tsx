import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

interface CourseMapFullScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  courseName: string;
  locationText?: string;
}

const CourseMapFullScreen: React.FC<CourseMapFullScreenProps> = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  courseName,
  locationText,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Swipe down to close handlers (only for header area)
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => onOpenChange(false),
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  // Generate deep link URLs
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(courseName)}&ll=${latitude},${longitude}&z=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  useEffect(() => {
    mountedRef.current = true;

    // When sheet is closed, clean up map
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

    if (!MAPBOX_TOKEN) return;
    if (!latitude || !longitude) return;

    // If map already exists, just recenter + resize
    if (mapRef.current) {
      mapRef.current.setCenter([longitude, latitude]);
      mapRef.current.resize();
      return;
    }

    // Delay initialization to allow Sheet to fully render
    initTimeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current || !mapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: [longitude, latitude],
        zoom: 13,
        interactive: true,
        maxZoom: 17,
        minZoom: 2,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });

      mapRef.current = map;

      // Navigation controls
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

      // Marker
      new mapboxgl.Marker({ color: '#ffffff' })
        .setLngLat([longitude, latitude])
        .addTo(map);

      // Ensure correct size once everything is loaded
      map.on('load', () => {
        map.resize();
      });

      // Guard against WebGL issues
      map.on('error', (e) => {
        if ((e as any)?.error?.message?.includes('WebGL')) {
          console.error('[Mapbox] WebGL error, removing map instance', e);
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
  }, [open, latitude, longitude]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[81vh] sm:h-[76vh] flex flex-col p-0"
      >
        {/* Header - swipe to close area */}
        <div {...swipeHandlers} className="px-4 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-0">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {courseName}
              </h2>
              {locationText && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locationText}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 pb-3 gap-4">
          {/* Map - Full bleed with borders */}
          <div 
            className="relative flex-1 rounded-none overflow-hidden border border-border/60 sm:border-border/40 bg-surface-alt w-[100vw] left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 sm:rounded-2xl sm:mx-4" 
            style={{ minHeight: '320px' }}
          >
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 px-4">
            {isIOS && (
              <Button
                className="flex-1 bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90 shadow-none"
                onClick={() => window.open(appleMapsUrl, '_blank')}
              >
                Open in Apple Maps
              </Button>
            )}
            <Button
              className={isIOS ? "flex-1" : "flex-1 bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"}
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

export default CourseMapFullScreen;
