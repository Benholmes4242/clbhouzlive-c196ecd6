import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

interface CourseMapPreviewProps {
  latitude: number;
  longitude: number;
  courseName: string;
  onOpenFullMap: () => void;
}

const CourseMapPreview: React.FC<CourseMapPreviewProps> = ({
  latitude,
  longitude,
  courseName,
  onOpenFullMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!MAPBOX_TOKEN) return;
    if (!latitude || !longitude) return;
    if (!mapContainerRef.current) return;

    // If map already exists, just recenter + resize
    if (mapRef.current) {
      mapRef.current.setCenter([longitude, latitude]);
      mapRef.current.resize();
      return;
    }

    // Single delayed initialization (no retry loop)
    const timeoutId = window.setTimeout(() => {
      if (!mountedRef.current || !mapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: [longitude, latitude],
        zoom: 13,
        interactive: false, // preview only
        attributionControl: false,
        maxZoom: 17,
        minZoom: 2,
      });

      mapRef.current = map;

      // Resize once the style has loaded to avoid partial renders
      map.on('load', () => {
        if (mountedRef.current) {
          map.resize();
        }
      });

      // Guard against WebGL issues
      map.on('error', (e) => {
        if ((e as any)?.error?.message?.includes('WebGL')) {
          console.error('[Mapbox Preview] WebGL error, removing map instance', e);
          map.remove();
          mapRef.current = null;
        }
      });

      // White marker at course location
      new mapboxgl.Marker({ color: '#ffffff' })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }, 150);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeoutId);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div
      onClick={onOpenFullMap}
      className="relative w-full h-44 sm:h-52 md:h-[200px] lg:h-[220px] rounded-2xl overflow-hidden border border-border/60 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] mb-3"
    >
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20" />
      <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white">
        Tap to expand map
      </div>
    </div>
  );
};

export default CourseMapPreview;
