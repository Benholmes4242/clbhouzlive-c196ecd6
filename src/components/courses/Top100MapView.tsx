import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSwipeable } from 'react-swipeable';
import {
  useTop100MapCourses,
  Top100MapScope,
  Top100MapCourse,
} from '@/hooks/useTop100MapCourses';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

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

// Region configs (includes the USA zoom+centre tweaks)
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

const Top100MapView: React.FC<Top100MapViewProps> = ({
  scope,
  onScopeChange,
  fullHeight = false,
}) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(
    null
  );
  const [ratedFilter, setRatedFilter] = useState<RatedFilter>('all');
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // swipe-down state for course sheet
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  // Swipe handlers for filters drawer
  const drawerSwipeHandlers = useSwipeable({
    onSwipedUp: () => setFiltersOpen(true),
    onSwipedDown: () => setFiltersOpen(false),
    trackMouse: false,
    trackTouch: true,
    delta: 30,
  });

  const {
    data: courses = [],
    isLoading,
  } = useTop100MapCourses(scope, session?.user?.id);

  const regionConfig = REGION_CONFIG[scope];

  // Filter courses by rated status
  const filteredCourses = useMemo(() => {
    if (ratedFilter === 'rated') return courses.filter((c) => c.user_has_rated);
    if (ratedFilter === 'unrated')
      return courses.filter((c) => !c.user_has_rated);
    return courses;
  }, [courses, ratedFilter]);

  // Official list size
  const officialTotal =
    REGION_TOTALS[scope] !== undefined ? REGION_TOTALS[scope] : courses.length;

  const ratedCount = courses.filter((c) => c.user_has_rated).length;
  const remaining = Math.max(officialTotal - ratedCount, 0);

  // Reset some state when scope changes
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

    // controls: attribution bottom-left, zoom bottom-right
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Fit to bounds when courses load (with special handling for USA)
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
      mapInstance.setZoom(currentZoom + 1); // extra zoom
      mapInstance.setCenter(regionConfig.center); // re-centre USA
    }

    setHasInitialFit(true);
  }, [courses, hasInitialFit, regionConfig, scope]);

  // Clustering + layers whenever filteredCourses change
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;

    const addClustering = () => {
      if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
      if (mapInstance.getLayer('cluster-count'))
        mapInstance.removeLayer('cluster-count');
      if (mapInstance.getLayer('unclustered-point'))
        mapInstance.removeLayer('unclustered-point');
      if (mapInstance.getSource('courses'))
        mapInstance.removeSource('courses');

      if (!filteredCourses.length) {
        console.log('[Top100MapView] ❌ No filtered courses to display');
        return;
      }

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
        clusterMaxZoom: 6,
        clusterRadius: 40,
      });

      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'courses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            14,
            10,
            18,
            25,
            22,
          ],
          'circle-color': '#0f172a',
          'circle-stroke-width': 0,
        },
      });

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

      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'courses',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'user_has_rated'], true],
            '#F7931E',
            '#0f172a',
          ],
          'circle-radius': 6,
          'circle-stroke-width': 0,
        },
      });

      // cluster click
      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        if (!clusterId) return;

        const source = mapInstance.getSource(
          'courses'
        ) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          mapInstance.easeTo({
            center: (features[0].geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: zoom || mapInstance.getZoom() + 2,
            duration: 500,
          });
        });
      });

      // pin click → sheet
      mapInstance.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const courseId = feature.properties?.id;
        const course = filteredCourses.find((c) => c.id === courseId);
        if (!course) return;

        setSelectedCourse(course);
        mapInstance.flyTo({
          center: [course.longitude, course.latitude],
          zoom: 8,
          duration: 800,
        });
      });

      // cursor styles
      mapInstance.on('mouseenter', 'clusters', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'clusters', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
      mapInstance.on('mouseenter', 'unclustered-point', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'unclustered-point', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    };

    if (mapInstance.isStyleLoaded()) {
      addClustering();
    } else {
      mapInstance.once('load', addClustering);
    }
  }, [filteredCourses]);

  const handleResetView = () => {
    if (!mapRef.current || !regionConfig) return;

    mapRef.current.flyTo({
      center: regionConfig.center,
      zoom: regionConfig.zoom,
      duration: 800,
    });

    setSelectedCourse(null);
    setRatedFilter('all');
  };

  // swipe handlers for course sheet
  const handleSheetTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setDragStartY(e.touches[0].clientY);
    setDragOffsetY(0);
  };

  const handleSheetTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY;
    if (delta > 0) setDragOffsetY(delta);
  };

  const handleSheetTouchEnd = () => {
    if (dragOffsetY > 60) {
      setSelectedCourse(null);
    }
    setDragStartY(null);
    setDragOffsetY(0);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-sq-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        <p className="font-semibold">Map Temporarily Unavailable</p>
        <p className="mt-1 text-xs text-slate-500">
          The interactive map feature is currently unavailable. Please try again
          later.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("top100-map-shell", fullHeight ? "h-full flex flex-col" : "space-y-3")}>
      <div className={cn("relative overflow-hidden rounded-sq-lg bg-muted/40", fullHeight ? "flex-1 min-h-0" : "mt-1")}>
        <div
          ref={mapContainerRef}
          className={cn("w-full", fullHeight ? "h-full" : "h-[480px]")}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sq-lg bg-white/60 text-xs text-slate-500">
            Loading map...
          </div>
        )}

        {/* Legend (top-left) */}
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <div className="flex items-center gap-3 rounded-sq-md bg-white/20 px-3 py-2 text-xs text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/30">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#F7931E]" />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0f172a]" />
              <span>Not Played</span>
            </div>
          </div>
        </div>

        {/* Stats pill (top-right) */}
        {officialTotal > 0 && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <div className="rounded-sq-md bg-white/20 px-3 py-2 text-xs font-medium text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/30">
              {ratedCount}/{officialTotal} Played · {remaining} left
            </div>
          </div>
        )}

        {/* Filters drawer – full bleed, glass */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div
            {...drawerSwipeHandlers}
            className={cn(
              'pointer-events-auto rounded-t-3xl rounded-b-none bg-white/20 backdrop-blur-xl border-t border-white/30 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.45)] text-xs text-slate-900 transition-transform duration-200',
              filtersOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-1.5">
              <div className="h-1 w-12 rounded-full bg-slate-400/80 dark:bg-slate-500/80" />
            </div>

            {/* Header / handle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 pb-2"
            >
              <span className="font-medium">Map filters</span>
              <span className="text-xs text-slate-500">
                {filtersOpen ? 'Hide' : 'Show'}
              </span>
            </button>

            {/* Drawer content */}
            <div className="px-4 pb-4 pt-2">
              {/* Rated filter + reset */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5">
                  {(['all', 'rated', 'unrated'] as RatedFilter[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRatedFilter(opt)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        'bg-white border border-border/70',
                        'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]',
                        ratedFilter === opt
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt === 'all'
                        ? 'All'
                        : opt === 'rated'
                        ? 'Played'
                        : 'Not Played'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleResetView}
                  className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                >
                  Reset view
                </button>
              </div>

              {/* Region chips */}
              <div className="flex items-center gap-2">
                {(['global', 'gb-i', 'usa', 'europe'] as Top100MapScope[]).map(
                  (slug) => {
                    const label =
                      slug === 'global'
                        ? 'Global'
                        : slug === 'gb-i'
                        ? 'GB&I'
                        : slug === 'usa'
                        ? 'USA'
                        : 'Europe';

                    const isActive = scope === slug;

                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => onScopeChange?.(slug)}
                        className={cn(
                          'flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                          'bg-white border border-border/70',
                          'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected course bottom sheet – glass, anchored, swipe-down & tap-outside */}
        {selectedCourse && (
          <div
            className="absolute inset-0 z-20 flex flex-col justify-end"
            onClick={() => setSelectedCourse(null)}
          >
            <div
              className="
                pointer-events-auto
                rounded-t-3xl rounded-b-none
                bg-white/20
                backdrop-blur-xl
                border border-white/20
                shadow-[0_8px_32px_rgba(0,0,0,0.2)]
                px-4 pb-4 pt-3
              "
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: dragOffsetY
                  ? `translateY(${dragOffsetY}px)`
                  : undefined,
                transition: dragStartY ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">{selectedCourse.name}</span>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {selectedCourse.sub_country &&
                      `${selectedCourse.sub_country}, `}
                    {selectedCourse.country}
                    {selectedCourse.region && ` · ${selectedCourse.region}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                {typeof selectedCourse.rank === 'number' && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                    #{selectedCourse.rank} in this list
                  </span>
                )}

                {selectedCourse.user_has_rated &&
                selectedCourse.user_rating ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                    Your rating: {selectedCourse.user_rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-600">
                    Not Played yet
                  </span>
                )}
              </div>

              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => navigate(`/courses/${selectedCourse.id}`)}
              >
                Open course
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Top100MapView;
