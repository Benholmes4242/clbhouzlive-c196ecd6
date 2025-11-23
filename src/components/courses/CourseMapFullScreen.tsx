import React, { useEffect, useRef, useState } from 'react';
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
  country?: string | null;
  subCountry?: string | null;
}

const CourseMapFullScreen: React.FC<CourseMapFullScreenProps> = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  courseName,
  country,
  subCountry,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Swipe down to close handlers
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (!isDragging) {
        onOpenChange(false);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  // Generate deep link URLs
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(courseName)}&ll=${latitude},${longitude}&z=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  useEffect(() => {
    // When sheet is closed, clean up map & timers and bail out
    if (!open) {
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (mapRef.current) {
        try {
          // Force WebGL context loss before removing (helps iOS Safari)
          const canvas = mapRef.current.getCanvas();
          const gl = canvas?.getContext('webgl') || canvas?.getContext('webgl2');
          if (gl && typeof (gl as any).getExtension === 'function') {
            const loseContext = (gl as any).getExtension('WEBGL_lose_context');
            if (loseContext) {
              loseContext.loseContext();
            }
          }
        } catch (err) {
          console.warn('[Mapbox Fullscreen] Error losing WebGL context:', err);
        }
        
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (!MAPBOX_TOKEN) return;
    if (!latitude || !longitude) return;

    let localRetryCount = 0;
    const maxRetries = 10; // 1s total

    const initMap = () => {
      // Clear any previous timeout before scheduling a new one
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (!mountedRef.current || !open) return;

      const container = mapContainerRef.current;
      if (!container) {
        if (localRetryCount < maxRetries) {
          localRetryCount++;
          retryTimeoutRef.current = window.setTimeout(initMap, 100);
        }
        return;
      }

      // Container must have a height to avoid 0px maps
      if (container.offsetHeight === 0) {
        if (localRetryCount < maxRetries) {
          localRetryCount++;
          retryTimeoutRef.current = window.setTimeout(initMap, 100);
        }
        return;
      }

      if (mapRef.current) {
        mapRef.current.setCenter([longitude, latitude]);
        mapRef.current.resize();
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      try {
        const map = new mapboxgl.Map({
          container,
          style: MAPBOX_STYLE,
          center: [longitude, latitude],
          zoom: 13,
          interactive: true,
        });

        mapRef.current = map;

        map.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: false }),
          'top-right'
        );

        new mapboxgl.Marker({ color: '#ffffff' })
          .setLngLat([longitude, latitude])
          .addTo(map);

        map.on('load', () => {
          if (!mountedRef.current || !open) return;
          map.resize();
        });
      } catch (err) {
        console.error('[Mapbox Fullscreen] Error creating map:', err);
      }
    };

    // Kick off after sheet animation
    retryTimeoutRef.current = window.setTimeout(initMap, 300);

    return () => {
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (mapRef.current) {
        try {
          // Force WebGL context loss before removing (helps iOS Safari)
          const canvas = mapRef.current.getCanvas();
          const gl = canvas?.getContext('webgl') || canvas?.getContext('webgl2');
          if (gl && typeof (gl as any).getExtension === 'function') {
            const loseContext = (gl as any).getExtension('WEBGL_lose_context');
            if (loseContext) {
              loseContext.loseContext();
            }
          }
        } catch (err) {
          console.warn('[Mapbox Fullscreen] Error losing WebGL context:', err);
        }
        
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, latitude, longitude]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[80vh] flex flex-col p-0"
        {...swipeHandlers}
      >
        {/* Grabber bar */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 'calc(8px + env(safe-area-inset-top, 0px))',
            width: 36,
            height: 5,
            background: 'rgba(255, 255, 255, 0.25)',
          }}
        />
        
        <div className="flex flex-col h-full px-4 pt-[calc(8px+env(safe-area-inset-top,0px)+5px+12px)] pb-3 gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {courseName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subCountry && `${subCountry}, `}{country}
              </p>
            </div>
          </div>

          {/* Map */}
          <div 
            className="relative flex-1 rounded-2xl overflow-hidden border border-border/60 bg-surface-alt" 
            style={{ minHeight: '320px' }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 pb-3">
            {isIOS && (
              <Button
                className="flex-1 bg-[var(--surface-slate)] text-white hover:bg-[var(--surface-slate)]/90"
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
