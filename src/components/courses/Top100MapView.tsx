import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/hero-glass.css';
import {
  useTop100MapCourses,
  Top100MapScope,
  Top100MapCourse,
  CourseJourneyStatus,
} from '@/hooks/useTop100MapCourses';
import { RotateCcw, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { MapCourseSheet } from './map';
import { MAP_CONFIG, applyClbhouzMapStyle } from '@/config/maps';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type StatusFilter = 'all' | 'played' | 'want_to_play' | 'not_played';

interface Top100MapViewProps {
  scope: Top100MapScope;
  onScopeChange?: (scope: Top100MapScope) => void;
  fullHeight?: boolean;
  onClose?: () => void;
}

// Region configs with premium zoom levels
const REGION_CONFIG: Record<
  Top100MapScope,
  { center: [number, number]; zoom: number; label: string }
> = {
  global: {
    center: [0, 25],
    zoom: 1.7,
    label: 'Global Top 100',
  },
  'gb-i': {
    center: [-3, 54],
    zoom: 4,
    label: 'GB&I Top 100',
  },
  usa: {
    center: [-99, 39],
    zoom: 3.5,
    label: 'USA Top 100',
  },
  europe: {
    center: [10, 50],
    zoom: 3,
    label: 'Europe Top 100',
  },
};

const PLAYED_COLOR = '#F7931E';       // dispatch amber — clbhouz brand token
const WANT_TO_PLAY_COLOR = '#22c55e'; // green-500 — aspiration, growth

// Shared fog config
const GLOBE_FOG_CONFIG: mapboxgl.FogSpecification = {
  color: 'rgb(220, 215, 206)',
  'high-color': 'rgb(160, 172, 192)',
  'horizon-blend': 0.04,
  'space-color': 'rgb(8, 10, 22)',
  'star-intensity': 0.06,
};

const Top100MapView: React.FC<Top100MapViewProps> = ({
  scope,
  onScopeChange,
  fullHeight = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  
  useMedianStatusBar("dark", "transparent", true, false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [trayExpanded, setTrayExpanded] = useState(true);
  const [regionPopoverOpen, setRegionPopoverOpen] = useState(false);

  // Played markers always use amber per design system (not season-themed)
  const seasonColor = '#F7931E';

  const {
    data: courses = [],
    isLoading,
  } = useTop100MapCourses(scope, session?.user?.id);

  const regionConfig = REGION_CONFIG[scope];

  // Filter courses by status
  const filteredCourses = useMemo(() => {
    if (statusFilter === 'played') return courses.filter((c) => c.journey_status === 'played');
    if (statusFilter === 'want_to_play') return courses.filter((c) => c.journey_status === 'want_to_play');
    if (statusFilter === 'not_played') return courses.filter((c) => c.journey_status === 'none');
    return courses;
  }, [courses, statusFilter]);

  const officialTotal = courses.length;
  const ratedCount = courses.filter((c) => c.journey_status === 'played').length;
  const wantToPlayCount = courses.filter((c) => c.journey_status === 'want_to_play').length;
  const remaining = Math.max(officialTotal - ratedCount, 0);
  const progressPercent = officialTotal > 0 ? Math.round((ratedCount / officialTotal) * 100) : 0;

  const regionsExplored = useMemo(() => {
    const playedCourses = courses.filter((c) => c.journey_status === 'played');
    const countries = new Set(playedCourses.map((c) => c.country).filter(Boolean));
    return countries.size;
  }, [courses]);

  // Reset filter/selection on scope change (but NOT the map)
  useEffect(() => {
    setHasInitialFit(false);
    setSelectedCourse(null);
    setStatusFilter('all');
  }, [scope]);

  // FIX 1: Initialize map ONCE on mount — no scope dependency
  useEffect(() => {
    if (!mapContainerRef.current || !MAP_CONFIG.TOKEN || mapRef.current) return;

    mapboxgl.accessToken = MAP_CONFIG.TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center: regionConfig.center,
      zoom: regionConfig.zoom,
      minZoom: 1.5,
      maxZoom: 12,
      attributionControl: false,
      projection: 'globe',
    });

    const mapInstance = mapRef.current;

    mapInstance.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    mapInstance.on('load', () => {
      setMapLoaded(true);
    });

    mapInstance.on('style.load', () => {
      applyClbhouzMapStyle(mapInstance, {
        showPlaceLabels: true,
        showWaterLabels: true,
      });

      mapInstance.setFog(GLOBE_FOG_CONFIG);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX 1: Animate camera to new region on scope change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const config = REGION_CONFIG[scope];
    mapRef.current.flyTo({
      center: config.center,
      zoom: config.zoom,
      duration: 1200,
      essential: true,
    });
  }, [scope, mapLoaded]);

  // Fit to bounds when courses load
  useEffect(() => {
    if (!mapRef.current || hasInitialFit || !courses.length || !regionConfig) {
      return;
    }

    const mapInstance = mapRef.current;
    const bounds = new mapboxgl.LngLatBounds();

    courses.forEach((course) => {
      bounds.extend([course.longitude, course.latitude]);
    });

    mapInstance.fitBounds(bounds, {
      padding: 40,
      maxZoom: regionConfig.zoom,
      duration: 600,
    });

    setHasInitialFit(true);
  }, [courses, hasInitialFit, regionConfig]);

  // Clustering + layers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;

    const addClustering = () => {
      // Clean up existing layers
      ['not-played-shadow', 'course-labels', 'clusters', 'cluster-halo', 'cluster-accent', 'cluster-count', 'played-points', 'want-to-play-points', 'want-to-play-glow', 'not-played-points'].forEach((id) => {
        if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
      });
      if (mapInstance.getSource('courses')) mapInstance.removeSource('courses');

      if (!filteredCourses.length) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: filteredCourses.map((course) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [course.longitude, course.latitude],
          },
          properties: {
            id: course.id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            region: course.region,
            rank: course.rank,
            user_has_rated: course.user_has_rated,
            user_rating: course.user_rating,
            journey_status: course.journey_status,
            isPlayed: course.journey_status === 'played',
            isWantToPlay: course.journey_status === 'want_to_play',
          },
        })),
      };

      mapInstance.addSource('courses', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 45,
        clusterProperties: {
          played_count: ['+', ['case', ['get', 'isPlayed'], 1, 0]],
          want_to_play_count: ['+', ['case', ['get', 'isWantToPlay'], 1, 0]],
        },
      });

      // FIX 3: Cluster halo (soft shadow)
      mapInstance.addLayer({
        id: 'cluster-halo',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'point_count'],
            2, 22,
            10, 26,
            25, 30,
            50, 34,
            100, 38,
          ],
          'circle-color': 'rgba(0, 0, 0, 0.08)',
          'circle-blur': 1,
        },
      });

      // FIX 3: Cluster circles - dark frosted glass
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'point_count'],
            2, 18,
            10, 22,
            25, 26,
            50, 30,
            100, 34,
          ],
          'circle-color': 'rgba(0, 0, 0, 0.35)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.2)',
          'circle-blur': 0,
        },
      });

      // FIX 3: Cluster accent ring — season color inner ring when mostly played
      mapInstance.addLayer({
        id: 'cluster-accent',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'point_count'],
            2, 15,
            10, 19,
            25, 23,
            50, 27,
            100, 31,
          ],
          'circle-color': 'transparent',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': [
            'case',
            ['>', ['/', ['get', 'played_count'], ['get', 'point_count']], 0.5],
            PLAYED_COLOR + '99', // 60% opacity
            'rgba(255, 255, 255, 0.15)',
          ],
        },
      });

      // Cluster count text
      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'courses',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Inter Semi Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': 'rgba(255, 255, 255, 0.9)',
        },
      });

      // FIX 2: Not Played shadow layer
      mapInstance.addLayer({
        id: 'not-played-shadow',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'none']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 9,
            8, 11,
            12, 15,
            16, 19,
          ],
          'circle-color': 'rgba(50, 50, 50, 0.15)',
          'circle-blur': 0.8,
          'circle-opacity-transition': { duration: 300, delay: 0 },
        },
      });

      // FIX 2: Not Played points — frosted ghost circles
      mapInstance.addLayer({
        id: 'not-played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'none']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,
            8, 10,
            12, 14,
            16, 18,
          ],
          'circle-color': 'rgba(55, 55, 55, 0.85)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.40)',
          'circle-opacity': 1.0,
          'circle-opacity-transition': { duration: 300, delay: 0 },
        },
      });

      // Want to Play glow
      mapInstance.addLayer({
        id: 'want-to-play-glow',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'want_to_play']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 14,
            8, 18,
            12, 22,
            16, 26,
          ],
          'circle-color': 'rgba(34, 197, 94, 0.2)',
          'circle-blur': 0.8,
          'circle-opacity-transition': { duration: 300, delay: 0 },
        },
      });

      // Want to Play points
      mapInstance.addLayer({
        id: 'want-to-play-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'want_to_play']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,
            8, 10,
            12, 14,
            16, 18,
          ],
          'circle-color': WANT_TO_PLAY_COLOR,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
          'circle-opacity-transition': { duration: 300, delay: 0 },
        },
      });

      // FIX 4: Played points — dynamic season color
      mapInstance.addLayer({
        id: 'played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'played']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,
            8, 10,
            12, 14,
            16, 18,
          ],
          'circle-color': PLAYED_COLOR,
          'circle-opacity': 1.0,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
          'circle-opacity-transition': { duration: 300, delay: 0 },
        },
      });

      // Course name labels
      mapInstance.addLayer({
        id: 'course-labels',
        type: 'symbol',
        source: 'courses',
        filter: ['!', ['has', 'point_count']],
        minzoom: 7,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            7, 9,
            9, 10,
            12, 12,
            16, 14,
          ],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-max-width': 8,
          'text-optional': true,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-font': ['Inter Semi Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': 'rgba(0,0,0,0.55)',
          'text-halo-color': 'rgba(255,255,255,0.85)',
          'text-halo-width': 1.5,
          'text-halo-blur': 0.5,
          'text-opacity': [
            'interpolate', ['linear'], ['zoom'],
            7, 0.6,
            9, 0.85,
            11, 1,
          ],
        },
      });

      // Click handlers
      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        if (!clusterId) return;

        const source = mapInstance.getSource('courses') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          mapInstance.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: zoom || mapInstance.getZoom() + 2,
            duration: 600,
          });
        });
      });

      const handlePointClick = (e: mapboxgl.MapMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const courseId = feature.properties?.id;
        const course = filteredCourses.find((c) => c.id === courseId);
        if (!course) return;

        setSelectedCourse(course);
        mapInstance.flyTo({
          center: [course.longitude, course.latitude],
          zoom: Math.max(mapInstance.getZoom(), 6),
          duration: 700,
        });
      };

      mapInstance.on('click', 'played-points', handlePointClick);
      mapInstance.on('click', 'want-to-play-points', handlePointClick);
      mapInstance.on('click', 'not-played-points', handlePointClick);

      ['clusters', 'played-points', 'want-to-play-points', 'not-played-points'].forEach((layer) => {
        mapInstance.on('mouseenter', layer, () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });
        mapInstance.on('mouseleave', layer, () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      });
    };

    if (mapInstance.isStyleLoaded()) {
      addClustering();
    } else {
      mapInstance.once('load', addClustering);
    }
  }, [filteredCourses, mapLoaded, seasonColor]);

  // Update played pin color when season color changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('played-points')) {
      map.setPaintProperty('played-points', 'circle-color', PLAYED_COLOR);
    }
  }, [seasonColor, mapLoaded]);

  const handleResetView = useCallback(() => {
    if (!mapRef.current || !regionConfig) return;

    mapRef.current.flyTo({
      center: regionConfig.center,
      zoom: regionConfig.zoom,
      duration: 900,
    });

    setSelectedCourse(null);
  }, [regionConfig]);

  if (!MAP_CONFIG.TOKEN) {
    return (
      <div className="rounded-sq-lg px-4 py-6 text-center text-sm" style={{ background: '#ffffff', border: '1px dashed rgba(15,23,42,0.15)', color: '#64748B' }}>
        <p className="font-semibold">Map Temporarily Unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The interactive map feature is currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'top100-map-shell relative',
      fullHeight ? 'h-full' : 'space-y-2'
    )}>
      {/* Map container */}
      <div
        className={cn(
          'relative overflow-hidden',
          fullHeight ? 'absolute inset-0' : 'rounded-sq-lg',
        )}
        style={{ background: '#1a2040' }}
      >
        <div
          ref={mapContainerRef}
          className={cn(
            'w-full transition-opacity duration-500',
            fullHeight ? 'h-full' : 'h-[500px]',
            mapLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Loading overlay */}
        {(isLoading || !mapLoaded) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(26,32,64,0.80)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Loading map...</span>
            </div>
          </div>
        )}

        {/* Back button — 44px circle with optional progress ring */}
        <button
          onClick={() => onClose ? onClose() : navigate(-1)}
          className="fixed left-4 z-40 flex items-center justify-center active:scale-95 transition-transform"
          style={{
            top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            position: 'fixed' as const,
          }}
          aria-label="Go back"
        >
          {/* Progress ring — SVG circle, only renders when user has progress */}
          {progressPercent > 0 && (
            <svg
              width="50"
              height="50"
              style={{ position: 'absolute' as const, inset: -3, pointerEvents: 'none' as const }}
              aria-hidden="true"
            >
              <circle
                cx="25"
                cy="25"
                r="23"
                fill="none"
                stroke={seasonColor}
                strokeWidth="2"
                strokeDasharray={`${(progressPercent / 100) * 144.51} 144.51`}
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
              />
            </svg>
          )}
          <ChevronLeft className="h-[20px] w-[20px] text-white" strokeWidth={2.4} />
        </button>

        {/* Reset view button — sole right-side floating control. Bound to trayExpanded for smooth bottom animation. */}
        <button
          onClick={handleResetView}
          className={cn(
            "fixed right-3 z-20 flex items-center justify-center transition-all duration-300 active:scale-[0.92]",
            selectedCourse ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
          )}
          style={{
            bottom: trayExpanded ? 220 : 96,
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(14px) saturate(180%)',
            WebkitBackdropFilter: 'blur(14px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
          aria-label="Reset map view"
        >
          <RotateCcw className="h-4 w-4 text-white/85" aria-hidden="true" />
        </button>

        {/* Empty state — bottom value follows tray collapse state */}
        {ratedCount === 0 && !isLoading && mapLoaded && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{
              bottom: trayExpanded ? 200 : 100,
              transition: 'bottom 300ms ease-out',
            }}
          >
            <div className="glass-card pointer-events-auto px-4 py-3 rounded-xl text-center">
              <p className="text-sm font-medium text-white/90">
                ⛳ Tap a course to start your journey
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Course bottom sheet */}
      <MapCourseSheet
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        scope={scope}
      />

      {/* Filter tray — outer wrapper always visible (handle, progress, summary). Inner block (status pills) collapses. */}
      <div 
        className={cn(
          "glass-card fixed bottom-0 left-0 right-0 z-30 !rounded-t-3xl !rounded-b-none !overflow-visible px-5 pt-2 pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+12px)] transition-all duration-300",
          selectedCourse ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
        )}
        style={{ borderBottom: 'none', position: 'fixed' }}
      >
        {/* C3 — Drag handle / collapse toggle */}
        <button
          onClick={() => setTrayExpanded((v) => !v)}
          className="mx-auto mb-2 flex items-center justify-center active:opacity-70 transition-opacity"
          style={{ width: 44, height: 24 }}
          aria-label={trayExpanded ? 'Collapse filters' : 'Expand filters'}
          aria-expanded={trayExpanded}
        >
          <span
            className="block rounded-full"
            style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.30)' }}
          />
        </button>

        <div className="space-y-3">
          {/* C4 — Flat 4px progress bar (blur glow dropped) */}
          <div className="relative">
            <div className="h-1 bg-white/15 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${progressPercent}%`,
                  background: PLAYED_COLOR
                }}
              />
            </div>
          </div>

          {/* C9 — Summary meta row: [RegionPill (popover trigger)] ··· [X of 100 · Y%] */}
          <div className="flex items-center justify-between">
            {/* C5 — Region selector popover */}
            <Popover open={regionPopoverOpen} onOpenChange={setRegionPopoverOpen} modal>
              <PopoverTrigger asChild>
                <button
                  aria-label={`Region: ${({ global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe' } as Record<Top100MapScope, string>)[scope]}. Tap to change.`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-[0.96]"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <span>{({ global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe' } as Record<Top100MapScope, string>)[scope]}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 p-1 border-0"
                style={{
                  background: 'rgba(15,23,42,0.92)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                {(['global', 'gb-i', 'usa', 'europe'] as Top100MapScope[]).map((regionScope) => {
                  const isActive = scope === regionScope;
                  const fullLabel = REGION_CONFIG[regionScope].label;
                  return (
                    <button
                      key={regionScope}
                      onClick={() => {
                        onScopeChange?.(regionScope);
                        setRegionPopoverOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors text-left',
                        isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:bg-white/8'
                      )}
                    >
                      <span>{fullLabel}</span>
                      {isActive && <Check className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Right side: count · percent */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span style={{ color: 'rgba(255,255,255,0.70)' }}>
                {ratedCount} of {officialTotal}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>
              <span style={{ color: PLAYED_COLOR }}>{progressPercent}%</span>
            </div>
          </div>

          {/* C2 — Inner collapsible block: status pills only */}
          <div
            className={cn(
              'transition-all duration-300 ease-out overflow-hidden',
              trayExpanded
                ? 'opacity-100 max-h-[120px]'
                : 'opacity-0 max-h-0 pointer-events-none'
            )}
          >
            {/* C6 — Status filter row: 3 pills, toggle-to-clear, 'Wishlist' relabel, dot indicator */}
            <div 
              className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.08]"
              role="group"
              aria-label="Filter courses by status"
            >
              {(['played', 'want_to_play', 'not_played'] as Exclude<StatusFilter, 'all'>[]).map((filter) => {
                const isActive = statusFilter === filter;
                const labels: Record<Exclude<StatusFilter, 'all'>, string> = {
                  played: 'Played',
                  want_to_play: 'Wishlist',
                  not_played: 'Not Played',
                };
                const dotColor: Record<Exclude<StatusFilter, 'all'>, string> = {
                  played: PLAYED_COLOR,
                  want_to_play: WANT_TO_PLAY_COLOR,
                  not_played: 'rgba(255,255,255,0.45)',
                };
                return (
                  <button
                    key={filter}
                    // Toggle-to-clear: tapping active pill resets to 'all'
                    onClick={() => setStatusFilter(isActive ? 'all' : filter)}
                    aria-pressed={isActive}
                    aria-label={`${isActive ? 'Clear' : 'Show'} ${labels[filter].toLowerCase()} filter`}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium',
                      'transition-all duration-200',
                      'active:scale-[0.96]',
                      isActive
                        ? 'bg-white/90 text-foreground'
                        : 'text-white/60 active:text-white/80 active:bg-white/[0.08]'
                    )}
                  >
                    <span
                      className="block rounded-full"
                      style={{ width: 6, height: 6, background: dotColor[filter] }}
                      aria-hidden="true"
                    />
                    <span>{labels[filter]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Top100MapView;
