import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { createGlassyMarkerElement } from './MapMarker';
import { MAP_CONFIG } from '@/config/maps';
import { openMapsUrl } from '@/utils/median/openMapsUrl';
import { getActorRouteByType } from '@/types/actor';

export interface MapExpandedViewNearbyPin {
  id: string;
  name: string;
  slug: string | null;
  lat: number;
  lng: number;
  category: string;
}

interface MapExpandedViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  name: string;
  locationText?: string;
  colorful?: boolean;
  nearby?: MapExpandedViewNearbyPin[];
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
  nearby,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const secondaryMarkersRef = useRef<mapboxgl.Marker[]>([]);
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
        if ((e as { error?: { message?: string } })?.error?.message?.includes('WebGL')) {
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
      secondaryMarkersRef.current.forEach((m) => m.remove());
      secondaryMarkersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, lat, lng]);

  // Secondary hospitality pins — mount after map is ready and re-sync on change.
  useEffect(() => {
    if (!open) return;
    const pins = nearby ?? [];
    let cancelled = false;

    const applyPins = () => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      secondaryMarkersRef.current.forEach((m) => m.remove());
      secondaryMarkersRef.current = [];
      pins.forEach((pin) => {
        if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', pin.name);
        el.title = pin.name;
        el.style.cssText =
          'width:12px;height:12px;padding:0;border-radius:9999px;background:#0F172A;' +
          'border:2px solid #FFFFFF;box-shadow:0 1px 3px rgba(15,23,42,0.35);' +
          'cursor:pointer;display:block;';
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const route = getActorRouteByType('business', pin.id, pin.slug);
          onOpenChange(false);
          navigate(route);
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);
        secondaryMarkersRef.current.push(marker);
      });
    };

    // If the map isn't up yet (init is timeout-gated), poll briefly.
    if (mapRef.current) {
      applyPins();
    } else {
      const iv = window.setInterval(() => {
        if (mapRef.current) {
          window.clearInterval(iv);
          applyPins();
        }
      }, 100);
      return () => {
        cancelled = true;
        window.clearInterval(iv);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [open, nearby, navigate, onOpenChange]);

  const destinations = isIOS
    ? [
        { label: t('map.openAppleMaps'), url: appleMapsUrl },
        { label: t('map.openGoogleMaps'), url: googleMapsUrl },
      ]
    : [
        { label: t('map.openGoogleMaps'), url: googleMapsUrl },
        { label: t('map.openAppleMaps'), url: appleMapsUrl },
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[75dvh] p-0 !rounded-t-2xl overflow-hidden flex flex-col immersive-map-sheet expanded-map-glass-controls"
        style={{ background: '#FFFFFF' }}
        hideCloseButton
      >
        {/* Grabber */}
        <div className="flex-none flex justify-center pt-2.5 pb-1">
          <div style={{ width: 38, height: 4, borderRadius: 2, background: '#DDE2E8' }} aria-hidden="true" />
        </div>

        {/* Header — kicker / title / place, no icon tile. Swipe down closes. */}
        <div
          {...swipeHandlers}
          className="flex-none flex items-start justify-between gap-3"
          style={{ padding: '6px 16px 12px' }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#0E1216' }}>
              {t('map.kicker')}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0E1216', marginTop: 3, letterSpacing: '-0.01em' }}>
              {name}
            </div>
            {locationText && (
              <div style={{ fontSize: 13, color: '#68707B', marginTop: 2 }}>{locationText}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('map.close')}
            className="flex-none"
            style={{ border: 'none', background: 'transparent', color: '#68707B', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map fills the remaining height */}
        <div className="flex-1 min-h-0 relative">
          <div ref={mapContainerRef} className="absolute inset-0" />
        </div>

        {/* Two equal destination rows, platform-ordered */}
        <div
          className="flex-none"
          style={{
            borderTop: '1px solid #EDF0F3',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {destinations.map((d, i) => (
            <button
              key={d.label}
              type="button"
              onClick={() => openMapsUrl(d.url)}
              className="w-full flex items-center justify-between text-left"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '15px 16px',
                borderBottom: i === destinations.length - 1 ? 'none' : '1px solid #EDF0F3',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0E1216' }}>{d.label}</span>
              <span
                aria-hidden="true"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', color: '#0E1216' }}
              >
                {'\u2197'}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapExpandedView;

