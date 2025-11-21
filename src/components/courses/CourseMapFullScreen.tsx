import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

interface CourseMapFullScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  courseName: string;
  country?: string | null;
  subCountry?: string | null;
}

const CourseMapFullScreen: React.FC<CourseMapFullScreenProps> = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  courseName,
  country,
  subCountry,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Generate deep link URLs
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(courseName)}&ll=${latitude},${longitude}&z=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  useEffect(() => {
    if (!open || !mapContainerRef.current) {
      // Clean up map when sheet closes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    // Don't recreate if already exists
    if (mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: [longitude, latitude],
      zoom: 13,
      interactive: true,
    });

    // Add navigation controls
    mapRef.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    // Add white marker at course location
    new mapboxgl.Marker({ color: '#ffffff' })
      .setLngLat([longitude, latitude])
      .addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, latitude, longitude]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[80vh] flex flex-col p-0"
      >
        <div className="flex flex-col h-full p-4 gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {courseName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subCountry && `${subCountry}, `}{country}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-border/60">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isIOS && (
              <Button
                className="flex-1"
                onClick={() => window.open(appleMapsUrl, '_blank')}
              >
                Open in Apple Maps
              </Button>
            )}
            <Button
              variant={isIOS ? 'outline' : 'default'}
              className="flex-1"
              onClick={() => window.open(googleMapsUrl, '_blank')}
            >
              Open in Google Maps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CourseMapFullScreen;
