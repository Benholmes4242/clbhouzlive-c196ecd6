import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
}

// Canonical list sizes
const REGION_TOTALS: Record<Top100MapScope, number> = {
  global: 77,
  'gb-i': 100,
  usa: 100,
  europe: 99,
};

// Region configs
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
    label: 'Britain & Ireland Top 100',
  },
  usa: {
    center: [-99, 39],
    zoom: 3.5,
    label: 'USA Top 100',
  },
  europe: {
    center: [10, 50],
    zoom: 3,
    label: 'Continental Europe Top 100',
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
}) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasInitialFit, setHasInitialFit] = useState(false);

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

  // Official list size
  const officialTotal = REGION_TOTALS[scope] ?? courses.length;
  const ratedCount = courses.filter((c) => c.journey_status === 'played').length;
  const wantToPlayCount = courses.filter((c) => c.journey_status === 'want_to_play').length;
  const remaining = Math.max(officialTotal - ratedCount, 0);

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

  // Initialise map
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
    // Custom zoom controls - don't add Mapbox default nav control

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
  }, [scope]);

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
      duration: 0,
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
      // Clean up existing layers
      ['clusters', 'cluster-count', 'played-points', 'want-to-play-points', 'want-to-play-glow', 'not-played-points'].forEach((id) => {
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

      // Cluster circles - color based on played ratio, stronger border for depth
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18, 5,
            22, 15,
            26, 30,
            30,
          ],
          'circle-color': [
            'case',
            ['>', ['/', ['get', 'played_count'], ['get', 'point_count']], 0.5],
            CLUSTER_COLOR_MOSTLY_PLAYED,
            CLUSTER_COLOR_MIXED,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.5)',
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
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // NOT PLAYED points (render first, bottom layer) - muted grey, minimal
      mapInstance.addLayer({
        id: 'not-played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'none']],
        paint: {
          'circle-radius': 4,
          'circle-color': 'rgba(255,255,255,0.6)',
          'circle-stroke-width': 1,
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
          'circle-radius': 12,
          'circle-color': 'rgba(247, 147, 30, 0.15)',
          'circle-blur': 0.8,
        },
      });

      // WANT TO PLAY points (middle layer) - outlined orange, hollow center
      mapInstance.addLayer({
        id: 'want-to-play-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'want_to_play']],
        paint: {
          'circle-radius': 6,
          'circle-color': 'rgba(255,255,255,0.9)',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': WANT_TO_PLAY_COLOR,
        },
      });

      // PLAYED points (render on top) - filled dark with subtle depth
      mapInstance.addLayer({
        id: 'played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'played']],
        paint: {
          'circle-radius': 7,
          'circle-color': PLAYED_COLOR,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.4)',
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
            duration: 500,
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
          duration: 600,
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
      duration: 800,
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
    <div className={cn('top100-map-shell', fullHeight ? 'h-full flex flex-col' : 'space-y-2')}>
      {/* Premium header - compact with pill + progress bar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        {/* Top row: Title + stats pill */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {regionConfig.label}
          </h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            <span className="text-slate-900 dark:text-white font-bold">{ratedCount}</span>
            <span className="text-slate-400">/</span>
            <span>{officialTotal}</span>
            <span className="text-slate-400 ml-0.5">played</span>
          </div>
        </div>
        
        {/* Secondary line */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
          {remaining} remaining · {regionsExplored} region{regionsExplored !== 1 ? 's' : ''} explored
        </p>
        
        {/* Progress strip */}
        <div className="mt-2.5 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min((ratedCount / officialTotal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Map container */}
      <div className={cn('relative overflow-hidden bg-muted/40', fullHeight ? 'flex-1 min-h-0' : 'rounded-sq-lg')}>
        <div
          ref={mapContainerRef}
          className={cn('w-full', fullHeight ? 'h-full' : 'h-[500px]')}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-xs text-slate-500">
            Loading map...
          </div>
        )}

        {/* Top overlay zone - Legend as micro-pills */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 px-3 pt-3">
          <div 
            className="pointer-events-auto flex items-center gap-1.5 w-fit"
            role="group"
            aria-label="Map legend"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-slate-200 shadow-sm" aria-hidden="true" />
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Played</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#F7931E] bg-transparent shadow-[0_0_4px_rgba(247,147,30,0.3)]" aria-hidden="true" />
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Want to Play</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
              <span className="inline-block h-2 w-2 rounded-full border-[1.5px] border-slate-400 bg-transparent" aria-hidden="true" />
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Not Played</span>
            </div>
          </div>
        </div>

        {/* Bottom-right control stack: orb + reset + zoom */}
        <div className="pointer-events-none absolute right-3 bottom-24 z-20 flex flex-col items-center gap-2">
          {/* Progress orb */}
          <div className="pointer-events-auto">
            <MapProgressOrb
              playedCount={ratedCount}
              totalCount={officialTotal}
              scope={scope}
              onMilestoneClick={() => navigate('/top100?tab=my-progress')}
            />
          </div>
          
          {/* Unified control buttons */}
          <div className="pointer-events-auto flex flex-col gap-1.5">
            {/* Zoom controls */}
            <div 
              className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-700/50 overflow-hidden"
              role="group"
              aria-label="Map zoom controls"
            >
              <button
                onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
                className="flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-800"
                aria-label="Zoom in"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
                className="flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                aria-label="Zoom out"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            
            {/* Reset view button */}
            <button
              onClick={handleResetView}
              className={cn(
                'flex items-center justify-center',
                'w-9 h-9 rounded-lg',
                'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
                'shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-700/50',
                'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700',
                'transition-colors duration-150'
              )}
              aria-label="Reset map view"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Course bottom sheet */}
        <MapCourseSheet
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          scope={scope}
        />
      </div>

      {/* Floating bottom control tray - premium glass */}
      <div className="flex-shrink-0 mx-3 mb-3">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-white/60 dark:border-slate-700/40 p-2.5 space-y-2">
          {/* Status filter row */}
          <div 
            className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/70"
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
                    'flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200',
                    isActive
                      ? filter === 'played'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : filter === 'want_to_play'
                        ? 'bg-[#F7931E] text-white shadow-sm'
                        : filter === 'not_played'
                        ? 'bg-slate-500 dark:bg-slate-400 text-white dark:text-slate-900 shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  )}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          {/* Region chips row */}
          <div 
            className="flex items-center gap-1"
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
                    'flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all duration-200',
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
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
