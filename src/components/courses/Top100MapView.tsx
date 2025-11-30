import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { useTop100MapCourses, Top100MapScope, Top100MapCourse } from '@/hooks/useTop100MapCourses';
import { Button } from '@/components/ui/button';
import { X, MapPin, Trophy } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Top100MapCourse | null>(null);
  const { data: courses = [], isLoading } = useTop100MapCourses(scope, session?.user?.id);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;
    if (map.current) return; // Already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const regionConfig = REGION_CONFIG[scope];

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
    <div className="relative">
      {/* Floating Summary Widget */}
      {!isLoading && courses.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg">
          <span className="text-sm font-medium text-foreground">
            {courses.filter(c => c.is_played).length} / {courses.length} courses played
          </span>
        </div>
      )}
      
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-[600px] rounded-2xl overflow-hidden border border-border/60"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-card/80 backdrop-blur-sm rounded-2xl">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Course Info Card - Bottom Sheet on Mobile, Side Card on Desktop */}
      {selectedCourse && (
        <div className="fixed md:absolute bottom-0 md:bottom-4 right-0 md:right-4 left-0 md:left-auto md:w-80 bg-card border border-border shadow-lg rounded-t-2xl md:rounded-2xl p-4 space-y-3 z-10">
          {/* Close Button */}
          <button
            onClick={() => setSelectedCourse(null)}
            className="absolute top-3 right-3 p-1 hover:bg-surface-alt rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Course Info */}
          <div className="pr-8">
            <h3 className="font-semibold text-foreground mb-1">{selectedCourse.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCourse.sub_country && `${selectedCourse.sub_country}, `}
              {selectedCourse.country}
            </p>
          </div>

          {/* Rank Badge */}
          {selectedCourse.rank && (
            <div className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs">
              <Trophy className="h-3 w-3 text-primary-accent" />
              <span className="text-foreground">
                {scope === 'global-top-100' && 'Global Top 100'}
                {scope === 'gb-i-top-100' && 'GB&I Top 100'}
                {scope === 'usa-top-100' && 'USA Top 100'}
                {scope === 'europe-top-100' && 'Europe Top 100'}
                {' · '}#{selectedCourse.rank}
              </span>
            </div>
          )}

          {/* CTA */}
          <Button onClick={handleViewCourse} className="w-full">
            View Course
          </Button>
        </div>
      )}
    </div>
  );
};

export default Top100MapView;
