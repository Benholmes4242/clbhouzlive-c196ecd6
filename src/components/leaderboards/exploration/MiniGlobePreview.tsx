import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, applyClbhouzMapStyle } from '@/config/maps';
import { MapIcon } from 'lucide-react';

mapboxgl.accessToken = MAP_CONFIG.TOKEN;

const ROTATION_SPEED = 0.3;
const RESUME_DELAY = 3000;

interface MiniGlobePreviewProps {
  playedCoordinates: { lat: number; lng: number }[];
  seasonColor: string;
  onTapExplore: () => void;
  height?: number;
}

export const MiniGlobePreview: React.FC<MiniGlobePreviewProps> = ({
  playedCoordinates,
  seasonColor,
  onTapExplore,
  height = 220,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number>(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isInteractingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer — lazy init
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !mapRef.current) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Rotation loop
  const rotateGlobe = useCallback(() => {
    const map = mapRef.current;
    if (!map || isInteractingRef.current) return;
    const center = map.getCenter();
    center.lng += ROTATION_SPEED;
    map.setCenter(center);
    animationRef.current = requestAnimationFrame(rotateGlobe);
  }, []);

  const resumeAfterDelay = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      rotateGlobe();
    }, RESUME_DELAY);
  }, [rotateGlobe]);

  const pauseRotation = useCallback(() => {
    isInteractingRef.current = true;
    cancelAnimationFrame(animationRef.current);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isVisible || mapRef.current || !containerRef.current) return;

    const mapOptions: mapboxgl.MapOptions = {
      container: containerRef.current,
      style: MAP_CONFIG.STYLE_URL,
      projection: 'globe',
      center: [10, 30],
      zoom: 1.3,
      minZoom: 1,
      maxZoom: 4,
      interactive: true,
      pitchWithRotate: false,
      doubleClickZoom: false,
      attributionControl: false,
      fadeDuration: 0,
    };
    // Force 1x rendering for perf (not in official types)
    (mapOptions as any).pixelRatio = 1;
    const map = new mapboxgl.Map(mapOptions);

    mapRef.current = map;

    map.on('style.load', () => {
      applyClbhouzMapStyle(map, {
        showPlaceLabels: false,
        showWaterLabels: false,
      });

      map.setFog({
        color: 'rgb(220, 215, 206)',
        'high-color': 'rgb(180, 190, 210)',
        'horizon-blend': 0.06,
        'space-color': 'rgb(8, 10, 22)',
        'star-intensity': 0.08,
      });
    });

    map.on('load', () => {
      setIsLoaded(true);

      // Add played courses source
      map.addSource('played-courses', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: playedCoordinates.map((c) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
            properties: {},
          })),
        },
      });

      // Glow layer
      map.addLayer({
        id: 'played-glow',
        type: 'circle',
        source: 'played-courses',
        paint: {
          'circle-radius': 8,
          'circle-color': seasonColor,
          'circle-opacity': 0.15,
          'circle-blur': 0.8,
        },
      });

      // Pin layer
      map.addLayer({
        id: 'played-pins',
        type: 'circle',
        source: 'played-courses',
        paint: {
          'circle-radius': 4,
          'circle-color': seasonColor,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.6)',
          'circle-opacity': 0.9,
        },
      });

      // Start rotation
      rotateGlobe();
    });

    // Interaction handlers
    map.on('touchstart', pauseRotation);
    map.on('mousedown', pauseRotation);
    map.on('touchend', resumeAfterDelay);
    map.on('mouseup', resumeAfterDelay);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
    // Only init once — playedCoordinates & seasonColor are baked in at init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Update source data when coordinates change after init
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const source = map.getSource('played-courses') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: 'FeatureCollection',
      features: playedCoordinates.map((c) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
        properties: {},
      })),
    });
  }, [playedCoordinates, isLoaded]);

  // Update pin colors when season color changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    if (map.getLayer('played-pins')) {
      map.setPaintProperty('played-pins', 'circle-color', seasonColor);
    }
    if (map.getLayer('played-glow')) {
      map.setPaintProperty('played-glow', 'circle-color', seasonColor);
    }
  }, [seasonColor, isLoaded]);

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl overflow-hidden"
      style={{
        height,
        marginLeft: 'calc(-50vw + 50% + 10px)',
        marginRight: 'calc(-50vw + 50% + 10px)',
        width: 'calc(100vw - 20px)',
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl" />
      )}

      {/* Mapbox container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      />

      {/* Inner vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.25)',
        }}
      />

      {/* Explore Map CTA */}
      <button
        onClick={onTapExplore}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white backdrop-blur-md active:scale-95 transition-transform"
        style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        Explore Map
        <MapIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default MiniGlobePreview;
