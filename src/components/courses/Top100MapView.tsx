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
import { RotateCcw } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { MapCourseSheet, MapProgressOrb } from './map';
import { MAP_CONFIG } from '@/config/maps';

type StatusFilter = 'all' | 'played' | 'want_to_play' | 'not_played';

interface Top100MapViewProps {
  scope: Top100MapScope;
  onScopeChange?: (scope: Top100MapScope) => void;
  /** When true, map fills 100% of parent height instead of fixed 480px */
  fullHeight?: boolean;
  /** Callback to close the modal (for full-bleed mode) */
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

// Marker colors - Played = slate, Want to Play = orange outline, Not Played = muted
const PLAYED_COLOR = '#0F172A'; // slate-900 (dark)
const WANT_TO_PLAY_COLOR = '#F7931E'; // Orange stroke, hollow center
const NOT_PLAYED_COLOR = '#94a3b8'; // Light grey (slate-400)
const CLUSTER_COLOR_MIXED = '#334155'; // slate-700
const CLUSTER_COLOR_MOSTLY_PLAYED = '#0F172A'; // slate-900 (not orange)

const Top100MapView: React.FC<Top100MapViewProps> = ({
  scope,
  onScopeChange,
  fullHeight = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // Official list size - derived dynamically from query results
  const officialTotal = courses.length;
  const ratedCount = courses.filter((c) => c.journey_status === 'played').length;
  const wantToPlayCount = courses.filter((c) => c.journey_status === 'want_to_play').length;
  const remaining = Math.max(officialTotal - ratedCount, 0);
  const progressPercent = officialTotal > 0 ? Math.round((ratedCount / officialTotal) * 100) : 0;

  // Count unique regions explored
  const regionsExplored = useMemo(() => {
    const playedCourses = courses.filter((c) => c.journey_status === 'played');
    const countries = new Set(playedCourses.map((c) => c.country).filter(Boolean));
    return countries.size;
  }, [courses]);

  // Reset state when scope changes
  useEffect(() => {
    setHasInitialFit(false);
    setSelectedCourse(null);
    setStatusFilter('all');
  }, [scope]);

  // Initialise map with premium styling
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
    });

    const mapInstance = mapRef.current;

    mapInstance.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    mapInstance.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [scope]);

  // Fit to bounds when courses load with smooth animation
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

    if (scope === 'usa') {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(currentZoom + 1);
      mapInstance.setCenter(regionConfig.center);
    }

    setHasInitialFit(true);
  }, [courses, hasInitialFit, regionConfig, scope]);

  // Clustering + layers with differentiated markers for 3 states
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;

    const addClustering = () => {
      // Clean up existing layers (including course-labels)
      ['course-labels', 'clusters', 'cluster-count', 'played-points', 'want-to-play-points', 'want-to-play-glow', 'not-played-points'].forEach((id) => {
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
          played_count: ['+', ['case', ['==', ['get', 'journey_status'], 'played'], 1, 0]],
        },
      });

      // Cluster circles - color based on played ratio, premium depth styling
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 5,
            24, 15,
            28, 30,
            32,
          ],
          'circle-color': [
            'case',
            ['>', ['/', ['get', 'played_count'], ['get', 'point_count']], 0.5],
            CLUSTER_COLOR_MOSTLY_PLAYED,
            CLUSTER_COLOR_MIXED,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.6)',
          'circle-blur': 0,
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
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // NOT PLAYED points (render first, bottom layer) - muted grey, zoom-responsive sizing with larger tap targets
      mapInstance.addLayer({
        id: 'not-played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'none']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,    // Larger tap target at world view
            8, 10,   // Medium at country view  
            12, 14,  // Larger when zoomed to region
            16, 18,  // Even larger when very zoomed in
          ],
          'circle-color': 'rgba(255,255,255,0.7)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': NOT_PLAYED_COLOR,
        },
      });

      // WANT TO PLAY glow layer (subtle halo for visibility)
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
          'circle-color': 'rgba(247, 147, 30, 0.2)',
          'circle-blur': 0.8,
        },
      });

      // WANT TO PLAY points (middle layer) - outlined orange, larger tap targets
      mapInstance.addLayer({
        id: 'want-to-play-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'want_to_play']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,    // Larger tap target
            8, 10,
            12, 14,
            16, 18,
          ],
          'circle-color': 'rgba(255,255,255,0.95)',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': WANT_TO_PLAY_COLOR,
        },
      });

      // PLAYED points (render on top) - filled dark, larger tap targets
      mapInstance.addLayer({
        id: 'played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'played']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,    // Larger tap target at world view
            8, 10,   // Medium at country view
            12, 14,  // Larger when zoomed to region
            16, 18,  // Even larger when very zoomed in
          ],
          'circle-color': PLAYED_COLOR,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'rgba(255,255,255,0.5)',
        },
      });

      // Course name labels - visible when courses are no longer clustered (zoom > 7)
      mapInstance.addLayer({
        id: 'course-labels',
        type: 'symbol',
        source: 'courses',
        filter: ['!', ['has', 'point_count']],
        minzoom: 7,  // Show labels as soon as courses are individually visible
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
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
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

      // Individual point click → open bottom sheet
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

      // Cursor styles
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
  }, [filteredCourses]);

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
      <div className="rounded-sq-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        <p className="font-semibold">Map Temporarily Unavailable</p>
        <p className="mt-1 text-xs text-slate-500">
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
      {/* Map container - full-bleed to top when fullHeight */}
      <div className={cn(
        'relative overflow-hidden',
        fullHeight ? 'absolute inset-0' : 'rounded-sq-lg',
        'bg-slate-100 dark:bg-slate-900'
      )}>
        <div
          ref={mapContainerRef}
          className={cn(
            'w-full transition-opacity duration-500',
            fullHeight ? 'h-full' : 'h-[500px]',
            mapLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Loading overlay with shimmer */}
        {(isLoading || !mapLoaded) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading map...</span>
            </div>
          </div>
        )}

        {/* Top overlay zone - Legend as premium glass pills (with safe area for notch) */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div 
            className="pointer-events-auto flex items-center gap-1.5 w-fit"
            role="group"
            aria-label="Map legend"
          >
            <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-full">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-slate-200 shadow-sm" aria-hidden="true" />
              <span className="text-[10px] font-medium text-white/90">Played</span>
            </div>
            <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-full">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#F7931E] bg-transparent shadow-[0_0_4px_rgba(247,147,30,0.4)]" aria-hidden="true" />
              <span className="text-[10px] font-medium text-white/90">Want to Play</span>
            </div>
            <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full border-[1.5px] border-white/60 bg-transparent" aria-hidden="true" />
              <span className="text-[10px] font-medium text-white/90">Not Played</span>
            </div>
          </div>
        </div>

        {/* Bottom-right control stack: orb + zoom controls - positioned above footer */}
        <div className="pointer-events-none absolute right-3 bottom-36 z-20 flex flex-col items-center gap-2.5">
          {/* Progress orb */}
          <div className="pointer-events-auto">
            <MapProgressOrb
              playedCount={ratedCount}
              totalCount={officialTotal}
              scope={scope}
              onMilestoneClick={() => navigate('/top100?tab=my-progress')}
            />
          </div>
          
          {/* Unified control buttons - liquid glass */}
          <div className="pointer-events-auto flex flex-col gap-2">
            {/* Zoom controls */}
            <div 
              className="glass-card flex flex-col rounded-xl overflow-hidden"
              role="group"
              aria-label="Map zoom controls"
            >
              <button
                onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
                className={cn(
                  'flex items-center justify-center w-10 h-10',
                  'text-white/80',
                  'hover:bg-white/10',
                  'active:bg-white/20',
                  'transition-colors duration-150',
                  'border-b border-white/10'
                )}
                aria-label="Zoom in"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
                className={cn(
                  'flex items-center justify-center w-10 h-10',
                  'text-white/80',
                  'hover:bg-white/10',
                  'active:bg-white/20',
                  'transition-colors duration-150'
                )}
                aria-label="Zoom out"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            
            {/* Reset view button */}
            <button
              onClick={handleResetView}
              className="glass-card flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:bg-white/10 active:bg-white/20 transition-all duration-150"
              aria-label="Reset map view"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Empty state overlay for 0 courses played - positioned above footer */}
        {ratedCount === 0 && !isLoading && mapLoaded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-44 z-10 flex justify-center">
            <div className="glass-card pointer-events-auto px-4 py-3 rounded-xl text-center">
              <p className="text-sm font-medium text-white/90">
                ⛳ Tap a course to start your journey
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Course bottom sheet - fixed, positioned above filters */}
      <MapCourseSheet
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        scope={scope}
        filterTrayHeight={150}
      />

      {/* Fixed bottom control tray - liquid glass with progress bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl px-5 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.10) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderBottom: 'none',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="space-y-3">
          {/* Progress bar - orange/amber gradient on glass */}
          <div className="relative">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              {/* Glow behind */}
              <div 
                className="absolute inset-0 rounded-full blur-sm opacity-60"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--tab-orange)), hsl(38, 95%, 60%))`,
                  width: `${progressPercent}%`,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              {/* Main bar - orange gradient */}
              <div 
                className="h-full rounded-full relative z-10 transition-all duration-700 ease-out"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, hsl(var(--tab-orange)), hsl(38, 95%, 60%))'
                }}
              />
            </div>
          </div>

          {/* Status filter row - glass pills */}
          <div 
            className="flex items-center gap-1 p-1 rounded-xl bg-white/10"
            role="group"
            aria-label="Filter courses by status"
          >
            {(['all', 'played', 'want_to_play', 'not_played'] as StatusFilter[]).map((filter) => {
              const isActive = statusFilter === filter;
              const labels: Record<StatusFilter, string> = {
                all: 'All',
                played: 'Played',
                want_to_play: 'Want to Play',
                not_played: 'Not Played',
              };
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  aria-pressed={isActive}
                  aria-label={`Show ${labels[filter].toLowerCase()} courses`}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-white/90 text-slate-900 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          {/* Region chips row - glass pills */}
          <div 
            className="flex items-center gap-1.5"
            role="group"
            aria-label="Filter by region"
          >
            {(['global', 'gb-i', 'usa', 'europe'] as Top100MapScope[]).map((regionScope) => {
              const isActive = scope === regionScope;
              const labels = { global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe' };
              return (
                <button
                  key={regionScope}
                  onClick={() => onScopeChange?.(regionScope)}
                  aria-pressed={isActive}
                  aria-label={`Show ${labels[regionScope]} Top 100`}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium',
                    'transition-all duration-200 border',
                    isActive
                      ? 'bg-white/90 text-slate-900 border-white/50 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/20 hover:text-white'
                  )}
                >
                  {labels[regionScope]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Top100MapView;
