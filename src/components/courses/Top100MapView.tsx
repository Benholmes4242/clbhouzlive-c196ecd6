import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { useTop100MapCourses, Top100MapScope, Top100MapCourse } from '@/hooks/useTop100MapCourses';
import { Button } from '@/components/ui/button';
import { X, MapPin, Trophy, Navigation } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Lists } from '@/hooks/useTop100Lists';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

// Region center and zoom configurations
const REGION_CONFIG: Record<Top100MapScope, { center: [number, number]; zoom: number }> = {
  'global-top-100': { center: [20, 30], zoom: 2 },
  'gb-i-top-100': { center: [-3, 54], zoom: 5 },
  'usa-top-100': { center: [-98, 39], zoom: 3.5 },
  'europe-top-100': { center: [10, 50], zoom: 4 },
};

interface Top100MapViewProps {
  scope: Top100MapScope;
}

const Top100MapView: React.FC<Top100MapViewProps> = ({ scope }) => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { data: lists } = useTop100Lists();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const { data: courses = [], isLoading } = useTop100MapCourses(scope, session?.user?.id);

  // Get active list label
  const activeList = lists?.find((l) => l.slug === scope);
  const activeListShortLabel = activeList?.short_label || 'Top 100';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;
    if (map.current) return; // Already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const regionConfig = REGION_CONFIG[scope];
    
    // Guard against invalid scope
    if (!regionConfig) {
      console.warn(`Invalid Top100MapScope: ${scope}`);
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: regionConfig.center,
      zoom: regionConfig.zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [scope]);

  // Update markers when courses change
  useEffect(() => {
    if (!map.current || !courses.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers with color based on played status
    courses.forEach((course) => {
      const isPlayed = course.is_played;
      const el = document.createElement('div');
      el.className = 'top100-marker';
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${isPlayed ? '#22c55e' : 'white'};
        border: 2px solid ${isPlayed ? '#16a34a' : 'hsl(var(--primary-accent))'};
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.borderWidth = '3px';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.borderWidth = '2px';
      });

      el.addEventListener('click', () => {
        setSelectedCourse(course);
        // Fly to the selected course
        map.current?.flyTo({
          center: [course.longitude, course.latitude],
          zoom: 12,
          duration: 1500,
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([course.longitude, course.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [courses]);

  // Handle view course
  const handleViewCourse = () => {
    if (selectedCourse) {
      navigate(`/courses/${selectedCourse.id}`);
    }
  };

  // Focus course on map
  const focusCourseOnMap = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course && map.current) {
      map.current.flyTo({
        center: [course.longitude, course.latitude],
        zoom: 12,
        duration: 1500,
      });
    }
  };

  // Error state
  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-2xl border border-border/60 bg-surface-card">
        <div className="text-center space-y-2 px-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Map Temporarily Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            The interactive map feature is currently unavailable. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-4 sm:pt-3">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Top 100 map
          </p>
          <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
            Explore the Top 100 on the map
          </h1>
          <p className="max-w-xl text-[12px] text-slate-400">
            Pan and zoom to discover Top 100 courses around the world. Tap markers
            to see course details.
          </p>
        </div>
      </header>

      {/* Map Container Card */}
      <section className="relative mt-1 overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/90 shadow-[0_22px_70px_rgba(15,23,42,0.8)]">
        {/* Map itself */}
        <div className="h-[420px] w-full sm:h-[520px]">
          <div
            ref={mapContainer}
            className="h-full w-full"
          />
        </div>

        {/* Top-left overlay: list pill */}
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2 sm:left-4 sm:top-4">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/90 px-3 py-1.5 text-[11px] text-slate-200 shadow-lg">
            <Trophy className="h-3 w-3" />
            <span className="font-medium">{activeListShortLabel}</span>
          </div>
        </div>

        {/* Top-right overlay: legend */}
        <div className="pointer-events-none absolute right-3 top-3 sm:right-4 sm:top-4">
          <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] text-slate-300 shadow-lg">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Played
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300" /> Not yet played
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary-accent border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-400">Loading map...</p>
            </div>
          </div>
        )}

        {/* Bottom course info bar */}
        {selectedCourse && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-3 pt-2 sm:pb-4">
            <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/95 px-3 py-2.5 sm:px-4 sm:py-3">
              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-50">
                  {selectedCourse.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {selectedCourse.sub_country && `${selectedCourse.sub_country}, `}
                  {selectedCourse.country}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  {selectedCourse.rank && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-[2px] text-[10px] text-amber-300">
                      <span className="text-[11px]">#{selectedCourse.rank}</span>
                      <span>{activeListShortLabel}</span>
                    </span>
                  )}
                  {selectedCourse.is_played && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/50 px-2 py-[2px] text-[10px] text-emerald-200">
                      Played by you
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleViewCourse}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-white"
                >
                  View course
                </button>
                <button
                  type="button"
                  onClick={() => focusCourseOnMap(selectedCourse.id)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Center on map
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Top100MapView;
