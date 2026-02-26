import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2 } from 'lucide-react';
import { createGlassyMarkerElement } from './MapMarker';
import { MAP_CONFIG } from '@/config/maps';

interface MapPreviewProps {
  lat: number;
  lng: number;
  name?: string;
  height?: number;
  zoom?: number;
  markerColor?: string;
  showExpandButton?: boolean;
  onExpand?: () => void;
  interactive?: boolean;
  colorful?: boolean;
}

/**
 * Unified map preview component using Mapbox GL JS.
 * Used across Courses, Business profiles, and Edit pages.
 */
export const MapPreview: React.FC<MapPreviewProps> = ({
  lat,
  lng,
  name = 'Location',
  height = MAP_CONFIG.HEIGHT.PREVIEW,
  zoom = MAP_CONFIG.ZOOM.PREVIEW,
  markerColor = MAP_CONFIG.MARKER_COLOR,
  showExpandButton = true,
  onExpand,
  interactive = false,
  colorful = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mountedRef = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Validate coordinates
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    mountedRef.current = true;

    if (!MAP_CONFIG.TOKEN) {
      console.warn('[MapPreview] VITE_MAPBOX_ACCESS_TOKEN not configured');
      return;
    }
    if (!hasValidCoords) return;
    if (!mapContainerRef.current) return;
    if (mapInitialized) return;

    const initMap = () => {
      if (!mountedRef.current || !mapContainerRef.current) return;
      if (mapRef.current) return;

      mapboxgl.accessToken = MAP_CONFIG.TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: colorful ? 'mapbox://styles/mapbox/streets-v12' : MAP_CONFIG.STYLE_URL,
        center: [lng, lat],
        zoom,
        interactive,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (mountedRef.current) {
          map.resize();
        }
      });

      // Add glassy orange marker (xs size for previews)
      const markerEl = createGlassyMarkerElement('xs');
      markerRef.current = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);
    };

    // Use IntersectionObserver to lazy-load map
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !mapInitialized && mountedRef.current) {
            setMapInitialized(true);
            setTimeout(initMap, 100);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(mapContainerRef.current);

    return () => {
      mountedRef.current = false;

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zoom, markerColor, interactive, mapInitialized, hasValidCoords, colorful]);

  // Reset map when coordinates change
  useEffect(() => {
    if (mapRef.current && hasValidCoords) {
      mapRef.current.setCenter([lng, lat]);
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
    }
  }, [lat, lng, hasValidCoords]);

  if (!hasValidCoords) {
    return null;
  }

  const handleClick = () => {
    if (onExpand) {
      onExpand();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-full overflow-hidden ${onExpand ? 'cursor-pointer' : ''}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full bg-muted animate-pulse" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      {showExpandButton && onExpand && (
        <button
          type="button"
          className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium shadow-lg"
        >
          <Maximize2 className="h-3 w-3" />
          <span>Tap to expand</span>
        </button>
      )}
    </div>
  );
};

export default MapPreview;
