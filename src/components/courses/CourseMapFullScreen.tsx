import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

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

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Generate deep link URLs
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(courseName)}&ll=${latitude},${longitude}&z=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  useEffect(() => {
    console.log('[Mapbox Fullscreen] Effect triggered:', { open, hasContainer: !!mapContainerRef.current, hasToken: !!MAPBOX_TOKEN, latitude, longitude });
    
    // When sheet is closed, clean up map and bail out
    if (!open) {
      if (mapRef.current) {
        console.log('[Mapbox Fullscreen] Cleaning up map');
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.warn('[Mapbox Fullscreen] No Mapbox token');
      return;
    }
    if (!latitude || !longitude) {
      console.warn('[Mapbox Fullscreen] No coordinates:', { latitude, longitude });
      return;
    }

    let timeoutId: number | null = null;
    let retryCount = 0;
    const maxRetries = 20; // 2 seconds max wait

    const initMap = () => {
      console.log('[Mapbox Fullscreen] initMap called, retry:', retryCount);
      
      // Check if container ref is available
      if (!mapContainerRef.current) {
        if (retryCount < maxRetries) {
          console.warn('[Mapbox Fullscreen] Container ref not ready, retrying in 100ms...');
          retryCount++;
          timeoutId = window.setTimeout(initMap, 100);
          return;
        } else {
          console.error('[Mapbox Fullscreen] Container ref never became available');
          return;
        }
      }

      // If map already exists (e.g. re-open), just recenter + resize
      if (mapRef.current) {
        console.log('[Mapbox Fullscreen] Map exists, recentering');
        mapRef.current.setCenter([longitude, latitude]);
        mapRef.current.resize();
        return;
      }

      const container = mapContainerRef.current;
      const height = container.offsetHeight;
      const width = container.offsetWidth;
      console.log('[Mapbox Fullscreen] Container dimensions:', { width, height });
      
      if (height === 0) {
        if (retryCount < maxRetries) {
          console.warn('[Mapbox Fullscreen] Container has no height, retrying in 100ms...');
          retryCount++;
          timeoutId = window.setTimeout(initMap, 100);
          return;
        } else {
          console.error('[Mapbox Fullscreen] Container never got height');
          return;
        }
      }

      console.log('[Mapbox Fullscreen] Initializing Mapbox with token');
      mapboxgl.accessToken = MAPBOX_TOKEN;

      try {
        const map = new mapboxgl.Map({
          container: container,
          style: MAPBOX_STYLE,
          center: [longitude, latitude],
          zoom: 13,
          interactive: true,
        });

        mapRef.current = map;
        console.log('[Mapbox Fullscreen] Map instance created');

        // Navigation controls
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

        // Marker
        new mapboxgl.Marker({ color: '#ffffff' })
          .setLngLat([longitude, latitude])
          .addTo(map);

        // Ensure correct size once everything is loaded
        map.on('load', () => {
          console.log('[Mapbox Fullscreen] Map loaded, resizing');
          map.resize();
        });

        // Extra safety: resize again shortly after load
        window.setTimeout(() => {
          console.log('[Mapbox Fullscreen] Secondary resize');
          map.resize();
        }, 200);
      } catch (error) {
        console.error('[Mapbox Fullscreen] Error creating map:', error);
      }
    };

    // Start trying to initialize after a short delay for Sheet animation
    console.log('[Mapbox Fullscreen] Scheduling initMap in 250ms');
    timeoutId = window.setTimeout(initMap, 250);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Cleanup handled at the top when open becomes false
    };
  }, [open, latitude, longitude]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[80vh] flex flex-col p-0"
      >
        <div className="flex flex-col h-full px-4 pt-4 pb-3 gap-4">
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
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-border/60 bg-surface-alt" style={{ minHeight: '320px' }}>
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-2">
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
              Open in Maps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CourseMapFullScreen;
