import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2 } from 'lucide-react';
import { createGlassyMarkerElement } from '@/components/map/MapMarker';

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
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mountedRef = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport (for future use if needed)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lazy-load map only when container is visible
  useEffect(() => {
    mountedRef.current = true;

    if (!MAPBOX_TOKEN) return;
    if (!latitude || !longitude) return;
    if (!mapContainerRef.current) return;
    if (mapInitialized) return; // Already initialized

    const initMap = () => {
      if (!mountedRef.current || !mapContainerRef.current) return;
      if (mapRef.current) return; // Already created

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLE,
        center: [longitude, latitude],
        zoom: 13,
        interactive: false,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (mountedRef.current) {
          map.resize();
        }
      });

      // Add glassy orange marker (same size as Business maps)
      const markerEl = createGlassyMarkerElement('md');
      markerRef.current = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([longitude, latitude])
        .addTo(map);
    };

    // Use IntersectionObserver to lazy-load map
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !mapInitialized && mountedRef.current) {
            setMapInitialized(true);
            // Small delay to ensure container is ready
            setTimeout(initMap, 100);
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before visible
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
  }, [latitude, longitude, mapInitialized]);

  // E1: Proper pill control for expand overlay
  return (
    <div
      onClick={onOpenFullMap}
      className="relative w-full h-[280px] sm:h-64 overflow-hidden cursor-pointer transition-all hover:opacity-95 rounded-none sm:rounded-xl border border-border/60 sm:border-border/40"
    >
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20" />
      
      {/* E1: Pill control overlay - looks like a proper control, not a watermark */}
      <button
        type="button"
        className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium shadow-lg"
      >
        <Maximize2 className="h-3 w-3" />
        <span>Tap to expand</span>
      </button>
    </div>
  );
};

export default CourseMapPreview;
