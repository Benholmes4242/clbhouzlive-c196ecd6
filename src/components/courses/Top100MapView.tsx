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

// Region center and zoom configurations
const REGION_CONFIG: Record<Top100MapScope, { center: [number, number]; zoom: number; label: string }> = {
  'global-top-100': { center: [20, 30], zoom: 2, label: 'Global Top 100' },
  'gb-i-top-100': { center: [-3, 54], zoom: 5, label: 'Britain & Ireland Top 100' },
  'usa-top-100': { center: [-98, 39], zoom: 3.5, label: 'USA Top 100' },
  'europe-top-100': { center: [10, 50], zoom: 4, label: 'Continental Europe Top 100' },
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

  const totalInList = courses.length;
  const ratedCount = courses.filter(c => c.user_has_rated).length;
  const remaining = Math.max(totalInList - ratedCount, 0);

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

  // Update markers when courses change
  useEffect(() => {
    if (!map.current || !filteredCourses.length) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers with color based on rated status
    filteredCourses.forEach((course) => {
      const isRated = course.user_has_rated;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'top100-marker';
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        background: ${isRated ? '#22c55e' : 'rgba(15, 23, 42, 0.9)'};
        border: 2px solid ${isRated ? '#22c55e' : 'rgba(148, 163, 184, 0.9)'};
        box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.5);
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.6)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.5)';
      });

      el.addEventListener('click', () => {
        setSelectedCourse(course);
        map.current?.flyTo({
          center: [course.longitude, course.latitude],
          zoom: 8,
          duration: 800,
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([course.longitude, course.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
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
      <div className="flex items-center justify-center h-[420px] rounded-3xl border border-slate-200 bg-white shadow-md">
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
    <div className="flex flex-col gap-4 pb-6">
      {/* Hero Strip */}
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm">
          🌍
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium text-slate-900 truncate">
            {regionConfig.label}
          </span>
          {totalInList > 0 && (
            <span className="truncate">
              You've rated{' '}
              <span className="font-semibold text-slate-900">
                {ratedCount}/{totalInList}
              </span>{' '}
              Top 100 courses
              {remaining > 0 && (
                <span className="text-amber-600">
                  {' '}· {remaining} left to complete this list
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
          {(['all', 'rated', 'unrated'] as RatedFilter[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRatedFilter(opt)}
              className={cn(
                'rounded-full px-3 py-1 transition-colors font-medium',
                ratedFilter === opt
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {opt === 'all' ? 'All' : opt === 'rated' ? 'Rated' : 'Not yet rated'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className="text-xs text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline transition-colors"
        >
          Reset view
        </button>
      </div>

      {/* Map Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-slate-900 shadow-lg">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-3 border-white/30 border-t-white rounded-full mx-auto" />
              <p className="text-sm text-white/80">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div ref={mapContainer} className="h-[420px] w-full" />

        {/* Legend & Stats Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between items-start p-3 text-xs gap-2">
          {/* Legend */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-white backdrop-blur-md shadow-lg">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm" />
              <span className="font-medium">Rated</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-slate-800 shadow-sm" />
              <span className="font-medium">Not yet rated</span>
            </span>
          </div>

          {/* Count Pill */}
          {totalInList > 0 && (
            <div className="pointer-events-auto rounded-full bg-slate-900/80 px-3 py-1.5 text-white backdrop-blur-md shadow-lg font-medium">
              {ratedCount}/{totalInList} rated · {remaining} left
            </div>
          )}
        </div>

        {/* Selected Course Bottom Sheet */}
        {selectedCourse && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 rounded-t-2xl p-4 space-y-3 shadow-xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>

            {/* Course Info */}
            <div className="pr-10">
              <h3 className="font-semibold text-slate-900 text-base mb-0.5 truncate">
                {selectedCourse.name}
              </h3>
              <p className="text-sm text-slate-500 truncate">
                {selectedCourse.sub_country && `${selectedCourse.sub_country}, `}
                {selectedCourse.country}
                {selectedCourse.region && ` · ${selectedCourse.region}`}
              </p>
            </div>

            {/* Rank & Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              {typeof selectedCourse.rank === 'number' && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs">
                  <span className="font-semibold text-amber-800">
                    #{selectedCourse.rank}
                  </span>
                  <span className="text-amber-600">in this list</span>
                </div>
              )}
              
              {selectedCourse.user_has_rated && selectedCourse.user_rating && (
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs">
                  <span className="text-emerald-600">Your rating:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedCourse.user_rating.toFixed(1)}
                  </span>
                </div>
              )}

              {!selectedCourse.user_has_rated && (
                <div className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  Not yet rated by you
                </div>
              )}
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate(`/courses/${selectedCourse.id}`)}
              variant="secondary"
              className="w-full rounded-full"
            >
              Open course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Top100MapView;
