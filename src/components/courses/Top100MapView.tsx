import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTop100MapCourses, Top100MapScope, Top100MapCourse } from '@/hooks/useTop100MapCourses';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

// Canonical list sizes for the Top 100 maps
const REGION_TOTALS: Record<Top100MapScope, number> = {
  global: 77,
  'gb-i': 100,
  usa: 100,
  europe: 99,
};

// Region center and zoom configurations
const REGION_CONFIG: Record<Top100MapScope, { center: [number, number]; zoom: number; label: string }> = {
  'global': { center: [-30, 40], zoom: 2, label: 'Global Top 100' },
  'gb-i': { center: [-3, 54], zoom: 5, label: 'Britain & Ireland Top 100' },
  'usa': { center: [-98, 39], zoom: 3.5, label: 'USA Top 100' },
  'europe': { center: [10, 50], zoom: 4, label: 'Continental Europe Top 100' },
};

type RatedFilter = 'all' | 'rated' | 'unrated';

interface Top100MapViewProps {
  scope: Top100MapScope;
}

const Top100MapView: React.FC<Top100MapViewProps> = ({ scope }) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const [ratedFilter, setRatedFilter] = useState<RatedFilter>('all');
  const { data: courses = [], isLoading } = useTop100MapCourses(scope, session?.user?.id);

  // Filter courses by rated status
  const filteredCourses = useMemo(() => {
    if (ratedFilter === 'rated') return courses.filter(c => c.user_has_rated);
    if (ratedFilter === 'unrated') return courses.filter(c => !c.user_has_rated);
    return courses;
  }, [courses, ratedFilter]);

  // Official list size for this map (falls back to what we have, just in case)
  const officialTotal =
    REGION_TOTALS[scope] !== undefined ? REGION_TOTALS[scope] : courses.length;

  const ratedCount = courses.filter((c) => c.user_has_rated).length;
  const remaining = Math.max(officialTotal - ratedCount, 0);

  const regionConfig = REGION_CONFIG[scope];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: regionConfig.center,
      zoom: regionConfig.zoom,
      minZoom: 1.5,
      maxZoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'bottom-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [scope]);

  // Update map data when courses change
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    // Wait for map to load before adding sources
    const addClustering = () => {
      // Remove existing source and layers if they exist
      if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
      if (mapInstance.getLayer('cluster-count')) mapInstance.removeLayer('cluster-count');
      if (mapInstance.getLayer('unclustered-point')) mapInstance.removeLayer('unclustered-point');
      if (mapInstance.getSource('courses')) mapInstance.removeSource('courses');

      if (!filteredCourses.length) {
        console.log('[Top100MapView] ❌ No filtered courses to display');
        return;
      }

      // Create GeoJSON from courses
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


      // Add clustered source
      mapInstance.addSource('courses', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 6, // Max zoom to cluster points on
        clusterRadius: 40, // Radius of each cluster when clustering points
      });

      console.log('[Top100MapView] ✅ Source "courses" added to map');
      
      // Verify source was added
      const verifySource = mapInstance.getSource('courses');
      console.log('[Top100MapView] Source verification:', verifySource ? 'EXISTS' : 'MISSING');

      // Cluster circles layer
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
          'circle-color': '#0f172a', // slate-900
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

      // Unclustered points layer - use brand orange for rated courses
      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'courses',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'user_has_rated'], true],
            '#F7931E', // rated: brand orange
            '#0f172a', // unrated: dark slate
          ],
          'circle-radius': 6,
          'circle-stroke-width': 0,
        },
      });

      console.log('[Top100MapView] ✅ All 3 layers added:', {
        clusters: mapInstance.getLayer('clusters') ? 'EXISTS' : 'MISSING',
        clusterCount: mapInstance.getLayer('cluster-count') ? 'EXISTS' : 'MISSING',
        unclusteredPoint: mapInstance.getLayer('unclustered-point') ? 'EXISTS' : 'MISSING'
      });

      // Log current map viewport
      console.log('[Top100MapView] 📍 Current map view:', {
        center: mapInstance.getCenter(),
        zoom: mapInstance.getZoom()
      });

      // Click handler for clusters - zoom in
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

      // Click handler for individual points - show course details
      mapInstance.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const courseId = feature.properties?.id;
        const course = filteredCourses.find((c) => c.id === courseId);
        if (course) {
          setSelectedCourse(course);
          mapInstance.flyTo({
            center: [course.longitude, course.latitude],
            zoom: 8,
            duration: 800,
          });
        }
      });

      // Change cursor on hover
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
      mapInstance.on('load', addClustering);
    }
  }, [filteredCourses]);

  // Handle reset view
  const handleResetView = () => {
    if (map.current && regionConfig) {
      map.current.flyTo({
        center: regionConfig.center,
        zoom: regionConfig.zoom,
        duration: 800,
      });
      setSelectedCourse(null);
      setRatedFilter('all');
    }
  };

  // Error state
  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-3xl border border-slate-200 bg-white shadow-md">
        <div className="text-center space-y-2 px-4">
          <MapPin className="h-12 w-12 mx-auto text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Map Temporarily Unavailable</h3>
          <p className="text-sm text-slate-500">
            The interactive map feature is currently unavailable. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Rated filter toggle: All / Rated / Not yet rated */}
      <div className="flex items-center justify-between gap-3 mt-5">
        <div className="inline-flex rounded-lg bg-muted/70 border border-border/60 p-0.5 shadow-sm">
          {(['all', 'rated', 'unrated'] as RatedFilter[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRatedFilter(opt)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
                ratedFilter === opt
                  ? 'bg-background text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {opt === 'all'
                ? 'All'
                : opt === 'rated'
                ? 'Rated'
                : 'Not yet rated'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
        >
          Reset view
        </button>
      </div>

      {/* Map Container */}
      <div className="top100-map-shell relative rounded-3xl bg-white shadow-md overflow-hidden mt-3">
        <div
          id="top100-map-container"
          ref={mapContainer}
          className="h-[400px]"
        />

        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-3 border-white/30 border-t-white rounded-full mx-auto" />
              <p className="text-sm text-white/80">Loading map...</p>
            </div>
          </div>
        )}

        {/* Legend & Stats Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between items-start p-3 text-xs gap-2">
          {/* Legend */}
          <div className="pointer-events-auto flex items-center gap-3 !rounded-2xl bg-slate-700/90 px-4 py-1.5 text-white backdrop-blur-md shadow-lg border border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: '#F7931E' }} />
              <span className="font-medium">Rated</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900 shadow-sm" />
              <span className="font-medium">Not yet rated</span>
            </span>
          </div>
        </div>

        {/* Selected Course Bottom Sheet */}
        {selectedCourse && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
            <div className="pointer-events-auto rounded-3xl bg-white/98 shadow-xl shadow-slate-900/10 border border-slate-100 backdrop-blur-sm">
              
              {/* Drag handle */}
              <div className="flex justify-center pt-2">
                <div className="h-1 w-10 rounded-full bg-slate-200" />
              </div>

              {/* Content */}
              <div className="px-4 pb-4 pt-2">
                
                {/* Title + close */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedCourse.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedCourse.sub_country && `${selectedCourse.sub_country}, `}
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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {typeof selectedCourse.rank === 'number' && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      #{selectedCourse.rank} in this list
                    </span>
                  )}

                  {selectedCourse.user_has_rated && selectedCourse.user_rating ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Your rating: {selectedCourse.user_rating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Not yet rated by you
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/courses/${selectedCourse.id}`)}
                  className="mt-4 w-full"
                >
                  Open course
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Top100MapView;
