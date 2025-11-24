import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
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

      new mapboxgl.Marker({ color: '#ffffff' })
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

  // On mobile, show lightweight button instead of map preview
  if (isMobile) {
    return (
      <Button
        onClick={onOpenFullMap}
        variant="outline"
        className="w-full h-16 flex items-center justify-center gap-2 text-base"
      >
        <MapPin className="h-5 w-5" />
        View map
      </Button>
    );
  }

  return (
    <div
      onClick={onOpenFullMap}
      className="relative w-full h-[280px] sm:h-64 overflow-hidden cursor-pointer transition-all hover:opacity-95 rounded-none sm:rounded-xl border border-border/60 sm:border-border/40"
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
