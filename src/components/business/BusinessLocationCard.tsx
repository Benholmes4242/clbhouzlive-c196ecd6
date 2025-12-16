import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

interface BusinessLocationCardProps {
  location: string;
  businessName: string;
  lat?: number | null;
  lng?: number | null;
}

export function BusinessLocationCard({ location, businessName, lat, lng }: BusinessLocationCardProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const fullMapContainerRef = useRef<HTMLDivElement | null>(null);
  const fullMapRef = useRef<mapboxgl.Map | null>(null);

  // Default to London if no coordinates
  const latitude = lat ?? 51.5074;
  const longitude = lng ?? -0.1278;
  const hasCoordinates = lat != null && lng != null;

  const handleDirections = () => {
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Initialize preview map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapInitialized || !hasCoordinates) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !mapRef.current) {
          setMapInitialized(true);
          
          mapboxgl.accessToken = MAPBOX_TOKEN;
          const map = new mapboxgl.Map({
            container: mapContainerRef.current!,
            style: MAPBOX_STYLE,
            center: [longitude, latitude],
            zoom: 13,
            interactive: false,
            attributionControl: false,
          });

          mapRef.current = map;

          map.on('load', () => {
            new mapboxgl.Marker({ color: '#F7931E' })
              .setLngLat([longitude, latitude])
              .addTo(map);
          });
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, mapInitialized, hasCoordinates]);

  // Initialize full screen map when opened
  useEffect(() => {
    if (!fullMapOpen || !MAPBOX_TOKEN || !fullMapContainerRef.current || !hasCoordinates) return;

    const timeout = setTimeout(() => {
      if (fullMapRef.current || !fullMapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: fullMapContainerRef.current,
        style: MAPBOX_STYLE,
        center: [longitude, latitude],
        zoom: 14,
        attributionControl: false,
      });

      fullMapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        new mapboxgl.Marker({ color: '#F7931E' })
          .setLngLat([longitude, latitude])
          .addTo(map);
      });
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (fullMapRef.current) {
        fullMapRef.current.remove();
        fullMapRef.current = null;
      }
    };
  }, [fullMapOpen, latitude, longitude, hasCoordinates]);

  return (
    <>
      <div className="bg-white rounded-sq-lg border" style={{ borderColor: 'rgba(31,36,40,0.08)' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(31,36,40,0.06)' }}>
          <h3 className="text-base font-semibold text-[#1F2428]">Location</h3>
          <p className="text-sm text-[#5E666D] mt-0.5">{location}</p>
        </div>

        {/* Map Preview */}
        {hasCoordinates && MAPBOX_TOKEN ? (
          <div
            onClick={() => setFullMapOpen(true)}
            className="relative w-full h-[180px] cursor-pointer hover:opacity-95 transition-opacity"
          >
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10" />
            
            {/* Tap to expand pill */}
            <button
              type="button"
              className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Tap to expand</span>
            </button>
          </div>
        ) : (
          <div className="w-full h-[120px] bg-slate-100 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-slate-300" />
          </div>
        )}

        {/* Get Directions button */}
        <div className="px-5 py-4">
          <Button
            variant="outline"
            className="w-full rounded-full text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
            onClick={handleDirections}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get directions
          </Button>
        </div>
      </div>

      {/* Full Screen Map Sheet */}
      <Sheet open={fullMapOpen} onOpenChange={setFullMapOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-semibold text-[#1F2428]">{businessName}</h3>
                <p className="text-sm text-[#5E666D]">{location}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleDirections}
              >
                <Navigation className="h-4 w-4 mr-1.5" />
                Directions
              </Button>
            </div>

            {/* Full Map */}
            <div ref={fullMapContainerRef} className="flex-1" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
