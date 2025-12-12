import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  useTop100MapCourses,
  Top100MapScope,
  Top100MapCourse,
} from '@/hooks/useTop100MapCourses';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { MapCourseSheet, MapProgressOrb, MapInsightChip } from './map';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

type RatedFilter = 'all' | 'rated' | 'unrated';

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

// Marker colors
const PLAYED_COLOR = '#F7931E';
const NOT_PLAYED_COLOR = '#64748b';
const CLUSTER_COLOR_MIXED = '#334155';
const CLUSTER_COLOR_PLAYED = '#F7931E';

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
  const [ratedFilter, setRatedFilter] = useState<RatedFilter>('all');
  const [hasInitialFit, setHasInitialFit] = useState(false);

  const {
    data: courses = [],
    isLoading,
  } = useTop100MapCourses(scope, session?.user?.id);

  const regionConfig = REGION_CONFIG[scope];

  // Filter courses by rated status
  const filteredCourses = useMemo(() => {
    if (ratedFilter === 'rated') return courses.filter((c) => c.user_has_rated);
    if (ratedFilter === 'unrated') return courses.filter((c) => !c.user_has_rated);
    return courses;
  }, [courses, ratedFilter]);

  // Official list size
  const officialTotal = REGION_TOTALS[scope] ?? courses.length;
  const ratedCount = courses.filter((c) => c.user_has_rated).length;
  const remaining = Math.max(officialTotal - ratedCount, 0);

  // Count unique regions explored
  const regionsExplored = useMemo(() => {
    const playedCourses = courses.filter((c) => c.user_has_rated);
    const countries = new Set(playedCourses.map((c) => c.country).filter(Boolean));
    return countries.size;
  }, [courses]);

  // Reset state when scope changes
  useEffect(() => {
    setHasInitialFit(false);
    setSelectedCourse(null);
    setRatedFilter('all');
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

  // Clustering + layers with differentiated markers
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;

    const addClustering = () => {
      // Clean up existing layers
      ['clusters', 'cluster-count', 'played-points', 'unplayed-points'].forEach((id) => {
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
          played_count: ['+', ['case', ['get', 'user_has_rated'], 1, 0]],
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
            CLUSTER_COLOR_PLAYED,
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

      // UNPLAYED points (render first, below played)
      mapInstance.addLayer({
        id: 'unplayed-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'user_has_rated'], false]],
        paint: {
          'circle-radius': 5,
          'circle-color': 'transparent',
          'circle-stroke-width': 2,
          'circle-stroke-color': NOT_PLAYED_COLOR,
        },
      });

      // PLAYED points (render on top, with glow effect)
      mapInstance.addLayer({
        id: 'played-points',
        type: 'circle',
        source: 'courses',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'user_has_rated'], true]],
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
      mapInstance.on('click', 'unplayed-points', handlePointClick);

      // Cursor styles
      ['clusters', 'played-points', 'unplayed-points'].forEach((layer) => {
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
    <div className={cn('top100-map-shell', fullHeight ? 'h-full flex flex-col' : 'space-y-3')}>
      {/* Header with dynamic stats */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {regionConfig.label}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {ratedCount} played · {remaining} remaining · {regionsExplored} region{regionsExplored !== 1 ? 's' : ''} explored
        </p>
      </div>

      {/* Map container */}
      <div className={cn('relative overflow-hidden bg-muted/40', fullHeight ? 'flex-1 min-h-0' : 'mt-1 rounded-sq-lg')}>
        <div
          ref={mapContainerRef}
          className={cn('w-full', fullHeight ? 'h-full' : 'h-[480px]')}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-xs text-slate-500">
            Loading map...
          </div>
        )}

        {/* Insight chip (top center) */}
        <MapInsightChip
          courses={courses}
          playedCount={ratedCount}
          totalCount={officialTotal}
          scope={scope}
          ratedFilter={ratedFilter}
        />

        {/* Legend (top-left) */}
        <div className="pointer-events-none absolute left-3 top-14 z-10">
          <div className="flex items-center gap-3 rounded-sq-md bg-white/90 dark:bg-slate-900/90 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/30 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F7931E] shadow-[0_0_6px_rgba(247,147,30,0.5)]" />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full border-2 border-slate-500 bg-transparent" />
              <span>Not Played</span>
            </div>
          </div>
        </div>

        {/* Reset view button (near zoom controls) */}
        <button
          onClick={handleResetView}
          className={cn(
            'absolute right-[52px] bottom-[88px] z-10',
            'flex items-center justify-center',
            'w-[29px] h-[29px] rounded-sq-sm',
            'bg-white shadow-md border border-slate-200',
            'text-slate-600 hover:bg-slate-50 active:bg-slate-100',
            'transition-colors duration-150'
          )}
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Floating progress orb */}
        <MapProgressOrb
          playedCount={ratedCount}
          totalCount={officialTotal}
          scope={scope}
          onMilestoneClick={() => navigate('/top100?tab=my-progress')}
        />

        {/* Course bottom sheet */}
        <MapCourseSheet
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          scope={scope}
        />
      </div>

      {/* Filters section */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] text-xs">
        <div className="px-4 pt-3 pb-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">Filters</span>
        </div>
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Status filter - Mode toggle style */}
          <div className="flex items-center gap-1 p-1 rounded-sq-pill bg-slate-100 dark:bg-slate-800 w-fit">
            {(['all', 'rated', 'unrated'] as RatedFilter[]).map((filter) => {
              const isActive = ratedFilter === filter;
              const labels = { all: 'All', rated: 'Played', unrated: 'Not Played' };
              return (
                <button
                  key={filter}
                  onClick={() => setRatedFilter(filter)}
                  className={cn(
                    'px-4 py-2 rounded-sq-pill text-xs font-medium transition-all duration-200',
                    isActive
                      ? filter === 'rated'
                        ? 'bg-[#F7931E] text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          {/* Region chips */}
          <div className="flex items-center gap-2">
            {(['global', 'gb-i', 'usa', 'europe'] as Top100MapScope[]).map((regionScope) => {
              const isActive = scope === regionScope;
              const labels = { global: 'Global', 'gb-i': 'GB&I', usa: 'USA', europe: 'Europe' };
              return (
                <button
                  key={regionScope}
                  onClick={() => onScopeChange?.(regionScope)}
                  className={cn(
                    'px-3 py-1.5 rounded-sq-pill text-xs font-medium border transition-all duration-200',
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
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
