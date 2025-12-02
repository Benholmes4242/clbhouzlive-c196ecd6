import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
}

// Canonical list sizes for the Top 100 maps
const REGION_TOTALS: Record<Top100MapScope, number> = {
  global: 77,
  'gb-i': 100,
  usa: 100,
  europe: 99,
};

// Region centre + zoom configs
// NOTE: zooms have been nudged OUT one level for GB&I / USA / Europe
// and the global view is a wider, more "world" centred view.
const REGION_CONFIG: Record<
  Top100MapScope,
  { center: [number, number]; zoom: number; label: string }
> = {
  global: {
    center: [0, 25], // previously [-30, 40] over the Atlantic
    zoom: 1.7, // slightly more zoomed OUT
    label: 'Global Top 100',
  },
  'gb-i': {
    center: [-3, 54],
    zoom: 4, // was 5 → zoomed out one step
    label: 'Britain & Ireland Top 100',
  },
  usa: {
    center: [-100, 40], // slightly further left and up to centre the US
    zoom: 3.5, // was 2.5 → zoomed in one level
    label: 'USA Top 100',
  },
  europe: {
    center: [10, 50],
    zoom: 3, // was 4 → zoomed out one step
    label: 'Continental Europe Top 100',
  },
};

const Top100MapView: React.FC<Top100MapViewProps> = ({ scope }) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(
    null
  );
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
    if (ratedFilter === 'unrated')
      return courses.filter((c) => !c.user_has_rated);
    return courses;
  }, [courses, ratedFilter]);

  // Official list size for this map (falls back to what we have, just in case)
  const officialTotal =
    REGION_TOTALS[scope] !== undefined ? REGION_TOTALS[scope] : courses.length;

  const ratedCount = courses.filter((c) => c.user_has_rated).length;
  const remaining = Math.max(officialTotal - ratedCount, 0);

  // Reset "initial fit" if the scope changes
  useEffect(() => {
    setHasInitialFit(false);
    setSelectedCourse(null);
    setRatedFilter('all');
  }, [scope]);

  // Initialise map once per scope
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
      attributionControl: false, // we'll add it manually bottom-left
    });

    const mapInstance = mapRef.current;

    // Controls
    mapInstance.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'bottom-right'
    );

    return () => {
      // Clean up on unmount / scope change
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Once courses are loaded, fit map to bounds (but never zoom in closer than
  // the region's configured zoom – this keeps GB&I/USA/Europe slightly zoomed out).
  useEffect(() => {
    if (!mapRef.current || hasInitialFit || !courses.length || !regionConfig) {
      return;
    }

    const mapInstance = mapRef.current;
    const bounds = new mapboxgl.LngLatBounds();

    courses.forEach((course) => {
      bounds.extend([course.longitude, course.latitude]);
    });

    // Fit to all courses first
    mapInstance.fitBounds(bounds, {
      padding: 40,
      maxZoom: regionConfig.zoom,
      duration: 0,
    });

    // For USA only, zoom in one extra step after the fit
    if (scope === 'usa') {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(currentZoom + 1);
    }

    setHasInitialFit(true);
  }, [courses, hasInitialFit, regionConfig, scope]);

  // Update map data + clustering whenever filteredCourses change
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;

    const addClustering = () => {
      // Remove existing source and layers if they exist
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

      // Cluster circles
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

      // Cluster count labels
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

      // Unclustered points (single courses)
      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'courses',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'user_has_rated'], true],
            '#F7931E', // Played
            '#0f172a', // Not Played
          ],
          'circle-radius': 6,
          'circle-stroke-width': 0,
        },
      });

      // Cluster click → zoom in
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

      // Single pin click → fly in + open bottom sheet
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

      // Cursor feedback
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

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        <p className="font-semibold">Map Temporarily Unavailable</p>
        <p className="mt-1 text-xs text-slate-500">
          The interactive map feature is currently unavailable. Please try
          again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter row: All / Played / Not Played + Reset view */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1 py-1">
          {(['all', 'rated', 'unrated'] as RatedFilter[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRatedFilter(opt)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                ratedFilter === opt
                  ? 'bg-background text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
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
          className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          Reset view
        </button>
      </div>

      {/* Map container */}
      <div className="relative mt-1 rounded-3xl bg-muted/40">
        <div
          ref={mapContainerRef}
          className="h-[400px] w-full rounded-3xl"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 text-xs text-slate-500">
            Loading map...
          </div>
        )}

        {/* Legend (top-left) */}
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900/90 px-3 py-1.5 text-[11px] text-white shadow-lg">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#F7931E]" />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-200" />
              <span>Not Played</span>
            </div>
          </div>
        </div>

        {/* Stats pill (top-right) */}
        {officialTotal > 0 && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <div className="rounded-2xl bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
              {ratedCount}/{officialTotal} Played · {remaining} left
            </div>
          </div>
        )}

        {/* Selected Course Bottom Sheet – now full-bleed + anchored */}
        {selectedCourse && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
            <div className="pointer-events-auto rounded-t-3xl rounded-b-none bg-white/95 px-4 pb-4 pt-3 shadow-2xl backdrop-blur-sm">
              {/* Drag handle */}
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />

              {/* Header row: title + close */}
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

              {/* Badges row */}
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

              {/* CTA */}
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
