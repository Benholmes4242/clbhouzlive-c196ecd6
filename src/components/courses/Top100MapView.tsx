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
import { MapCourseSheet, MapProgressOrb, MapInsightChip } from './map';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

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
    if (!mapContainerRef.current || !MAPBOX_TOKEN || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
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
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'bottom-right'
    );

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
      ['clusters', 'cluster-count', 'played-points', 'want-to-play-points', 'not-played-points'].forEach((id) => {
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

      // Cluster circles - color based on played ratio
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16, 5,
            20, 15,
            24, 30,
            28,
          ],
          'circle-color': [
            'case',
            ['>', ['/', ['get', 'played_count'], ['get', 'point_count']], 0.5],
            CLUSTER_COLOR_MOSTLY_PLAYED,
            CLUSTER_COLOR_MIXED,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
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

      // NOT PLAYED points (render first, bottom layer) - muted grey
      mapInstance.addLayer({
        id: 'not-played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'none']],
        paint: {
          'circle-radius': 5,
          'circle-color': 'transparent',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': NOT_PLAYED_COLOR,
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
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': WANT_TO_PLAY_COLOR,
        },
      });

      // PLAYED points (render on top, with glow effect) - filled orange
      mapInstance.addLayer({
        id: 'played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'journey_status'], 'played']],
        paint: {
          'circle-radius': 7,
          'circle-color': PLAYED_COLOR,
          'circle-blur': 0.15,
          'circle-stroke-width': 0,
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

  if (!MAPBOX_TOKEN) {
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
      {/* Header with dynamic stats - tighter spacing */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
          {regionConfig.label}
        </h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
          {ratedCount} played · {remaining} remaining · {regionsExplored} region{regionsExplored !== 1 ? 's' : ''} explored
        </p>
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

        {/* Top overlay zone - consistent padding */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 px-3 pt-3">
          {/* Insight chip (centered) */}
          <div className="pointer-events-auto flex justify-center mb-2">
            <MapInsightChip
              courses={courses}
              playedCount={ratedCount}
              totalCount={officialTotal}
              scope={scope}
              ratedFilter={statusFilter === 'played' ? 'rated' : statusFilter === 'not_played' ? 'unrated' : 'all'}
            />
          </div>
          
          {/* Legend row - aligned with same padding */}
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-sq-sm bg-white/90 dark:bg-slate-900/90 px-2.5 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.1)] backdrop-blur-xl border border-white/40 dark:border-slate-700/50 w-fit">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-200" />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full border-2 border-[#F7931E] bg-transparent" />
              <span>Want to Play</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full border border-slate-400 bg-transparent" />
              <span>Not Played</span>
            </div>
          </div>
        </div>

        {/* Bottom-right control stack: orb + reset */}
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
          
          {/* Reset view button */}
          <button
            onClick={handleResetView}
            className={cn(
              'pointer-events-auto',
              'flex items-center justify-center',
              'w-8 h-8 rounded-sq-sm',
              'bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-slate-200/80',
              'text-slate-500 hover:bg-slate-50 active:bg-slate-100',
              'transition-colors duration-150'
            )}
            title="Reset view"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Course bottom sheet */}
        <MapCourseSheet
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          scope={scope}
        />
      </div>

      {/* Floating bottom control tray */}
      <div className="flex-shrink-0 mx-4 mb-4">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-200/60 dark:border-slate-700/60 p-3 space-y-2.5">
          {/* Status filter row */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800">
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
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                    isActive
                      ? filter === 'played'
                        ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                        : filter === 'want_to_play'
                        ? 'bg-[#F7931E]/15 text-[#F7931E] border border-[#F7931E] shadow-sm'
                        : filter === 'not_played'
                        ? 'bg-slate-400 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  )}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          {/* Region chips row */}
          <div className="flex items-center gap-1.5">
            {(['global', 'gb-i', 'usa', 'europe'] as Top100MapScope[]).map((regionScope) => {
              const isActive = scope === regionScope;
              const labels = { global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe' };
              return (
                <button
                  key={regionScope}
                  onClick={() => onScopeChange?.(regionScope)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200',
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
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
