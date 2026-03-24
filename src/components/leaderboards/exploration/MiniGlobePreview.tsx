import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, applyClbhouzMapStyle } from '@/config/maps';
import { MapIcon } from 'lucide-react';

mapboxgl.accessToken = MAP_CONFIG.TOKEN;

const ROTATION_SPEED = 0.15;
const RESUME_DELAY = 3000;

// Shared fog config — matches full map (FIX 10)
const GLOBE_FOG_CONFIG: mapboxgl.FogSpecification = {
  color: 'rgb(220, 215, 206)',
  'high-color': 'rgb(160, 172, 192)',
  'horizon-blend': 0.04,
  'space-color': 'rgb(8, 10, 22)',
  'star-intensity': 0.06,
};

// FIX 5: Continent centroids for custom label layer
const CONTINENT_CENTROIDS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [15, 50] }, properties: { name: 'EUROPE' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [100, 35] }, properties: { name: 'ASIA' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [20, 5] }, properties: { name: 'AFRICA' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-100, 45] }, properties: { name: 'NORTH AMERICA' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-60, -15] }, properties: { name: 'SOUTH AMERICA' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [135, -25] }, properties: { name: 'OCEANIA' } },
  ],
};

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
  height = 264,
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
      maxZoom: 2.2, // FIX 9: Cap zoom to keep globe spherical
      interactive: true,
      pitchWithRotate: false,
      doubleClickZoom: false,
      scrollZoom: false, // FIX 9: Prevent accidental scroll zoom
      attributionControl: false,
      fadeDuration: 0,
    };
    (mapOptions as any).pixelRatio = 1;
    (mapboxgl as any).config.EVENTS_URL = '';
    const map = new mapboxgl.Map(mapOptions);

    mapRef.current = map;

    map.on('style.load', () => {
      applyClbhouzMapStyle(map, {
        showPlaceLabels: false,
        showWaterLabels: false,
        showContinentLabels: true,
      });

      // FIX 10: Unified fog
      map.setFog(GLOBE_FOG_CONFIG);
    });

    map.on('load', () => {
      setIsLoaded(true);

      // FIX 5: Add custom continent labels
      map.addSource('continent-labels', {
        type: 'geojson',
        data: CONTINENT_CENTROIDS,
      });

      map.addLayer({
        id: 'continent-labels-layer',
        type: 'symbol',
        source: 'continent-labels',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Inter Semi Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-letter-spacing': 0.15,
          'text-transform': 'uppercase',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': 'rgba(0, 0, 0, 0.25)',
          'text-halo-color': 'rgba(255, 255, 255, 0.6)',
          'text-halo-width': 1.5,
        },
      });

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

      // FIX 8: Glow layer — increased presence
      map.addLayer({
        id: 'played-glow',
        type: 'circle',
        source: 'played-courses',
        paint: {
          'circle-radius': 12,
          'circle-color': seasonColor,
          'circle-opacity': 0.25,
          'circle-blur': 1.0,
        },
      });

      // FIX 8: Pin layer — increased size and stroke
      map.addLayer({
        id: 'played-pins',
        type: 'circle',
        source: 'played-courses',
        paint: {
          'circle-radius': 5,
          'circle-color': seasonColor,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
          'circle-opacity': 1.0,
        },
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Update source data when coordinates change
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
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl" />
      )}

      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      />

      {/* Inner vignette */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2)',
        }}
      />

      {/* Explore Map CTA — canonical glass */}
      <button
        onClick={onTapExplore}
        className="glass-card absolute bottom-3 right-3 flex items-center gap-1.5 !rounded-xl !overflow-visible px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
        style={{ position: 'absolute' }}
      >
        Explore Map
        <MapIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default MiniGlobePreview;
