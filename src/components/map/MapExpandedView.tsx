import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MapPin, X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { createGlassyMarkerElement } from './MapMarker';
import { MAP_CONFIG } from '@/config/maps';
import { openMapsUrl } from '@/utils/median/openMapsUrl';

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

  // Deep link URLs — both are https universal links so the OS can route to
  // the native Apple Maps / Google Maps app on device (via openMapsUrl's
  // direct-navigation path) and fall back to the web mapping UI on desktop.
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
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
        className="h-[75dvh] p-0 !rounded-t-2xl overflow-hidden immersive-map-sheet expanded-map-glass-controls"
        hideCloseButton
      >
        {/* Map IS the sheet */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Floating grabber (affordance only) */}
        <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-black/25" />

        {/* Floating header card - swipe down here closes */}
        <div
          {...swipeHandlers}
          className="absolute top-[18px] left-3 right-3 flex items-center gap-3 rounded-2xl px-3.5 py-3"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.15)',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'rgba(247,147,30,0.12)', color: '#F7931E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={16} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            {locationText && (
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {locationText}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="shrink-0 flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(15,23,42,0.06)', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Floating launch dock */}
        <div
          className="pointer-events-none absolute left-3 right-3 flex gap-2.5"
          style={{ bottom: 'calc(max(16px, env(safe-area-inset-bottom, 0px)) + 4px)' }}
        >
          {isIOS && (
            <button
              type="button"
              onClick={() => openMapsUrl(appleMapsUrl)}
              className="pointer-events-auto flex-1"
              style={{
                height: 50, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: '#F7931E', color: '#fff',
                fontSize: 13.5, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
              }}
            >
              Open in Apple Maps
            </button>
          )}
          <button
            type="button"
            onClick={() => openMapsUrl(googleMapsUrl)}
            className="pointer-events-auto flex-1"
            style={{
              height: 50, borderRadius: 999, cursor: 'pointer',
              background: isIOS ? 'rgba(255,255,255,0.92)' : '#F7931E',
              color: isIOS ? '#0F172A' : '#fff',
              border: isIOS ? '1px solid rgba(15,23,42,0.08)' : 'none',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              fontSize: 13.5, fontWeight: 700,
              boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
            }}
          >
            {isIOS ? 'Google Maps' : 'Open in Google Maps'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapExpandedView;
