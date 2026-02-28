import * as React from "react";
import { createPortal } from "react-dom";
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideOver } from '@/components/ui/slide-over';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapThumbnailProps {
  clubId: string;
  clubName: string;
  region?: string;
  country: string;
  subCountry?: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'; // NEW (optional)
}

const MapThumbnail = ({
  clubId,
  clubName,
  region,
  country,
  subCountry,
  latitude,
  longitude,
  className = '',
  mapType // NEW
}: MapThumbnailProps) => {
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [showLargeMap, setShowLargeMap] = React.useState(false);
  const [mapImageUrl, setMapImageUrl] = React.useState<string | null>(null);
  const [largeMapImageUrl, setLargeMapImageUrl] = React.useState<string | null>(null);
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  

  const generateMapUrl = async (lat: number, lng: number, size: string, zoom: number = 13, mapType?: MapThumbnailProps['mapType']): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-map-url', {
        body: {
          latitude: lat,
          longitude: lng,
          size,
          zoom,
          maptype: mapType
        }
      });

      if (error) {
        console.error('Error generating map URL:', error);
        return null;
      }

      return data?.mapUrl || null;
    } catch (error) {
      console.error('Error calling generate-map-url function:', error);
      return null;
    }
  };

  const generateAppleMapsUrl = (lat: number, lng: number) => {
    return `maps://maps.apple.com/?q=${encodeURIComponent(clubName)}&ll=${lat},${lng}&z=13`;
  };

  const generateGoogleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const geocodeClub = async () => {
    if (coords) return; // Already have coordinates
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-club', {
        body: {
          clubId,
          clubName,
          region,
          country,
          subCountry
        }
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast.error("Could not find location for this club");
        return;
      }

      if (data?.latitude && data?.longitude) {
        const newCoords = { lat: data.latitude, lng: data.longitude };
        setCoords(newCoords);
      }
    } catch (error) {
      console.error('Error geocoding club:', error);
        toast.error("Couldn't geocode location");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate map image URLs when coordinates are available
  React.useEffect(() => {
    const generateMapUrls = async () => {
      if (coords) {
        const thumbnailSize = isMobile ? '280x180' : '320x220';
        const largeSize = isMobile ? '350x300' : '600x400';
        
        const [thumbnailUrl, largeUrl] = await Promise.all([
          generateMapUrl(coords.lat, coords.lng, thumbnailSize, 13, mapType),
          generateMapUrl(coords.lat, coords.lng, largeSize, 15, mapType)
        ]);
        
        setMapImageUrl(thumbnailUrl);
        setLargeMapImageUrl(largeUrl);
      }
    };

    generateMapUrls();
  }, [coords, isMobile, mapType]);

  // Find the portal element inside ProfileModalRouter
  React.useEffect(() => {
    setPortalEl(document.getElementById('modal-portal'));
  }, []);

  // Close on ESC for accessibility
  React.useEffect(() => {
    if (!showLargeMap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLargeMap(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLargeMap]);

  // Lock page scroll while modal is open
  React.useEffect(() => {
    if (!showLargeMap) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [showLargeMap]);

  // Send focus into the modal & restore on close
  React.useEffect(() => {
    if (showLargeMap) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      // focus first focusable in modal, or the dialog
      setTimeout(() => dialogRef.current?.focus(), 0);
    } else {
      lastFocusedRef.current?.focus?.();
    }
  }, [showLargeMap]);

  // Attempt to geocode on mount if no coordinates
  React.useEffect(() => {
    if (!coords && !isLoading) {
      geocodeClub();
    }
  }, [clubId]);

  // Simple focus containment
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const handleThumbnailClick = () => {
    if (!coords) return;

    if (isMobile) {
      // Try Apple Maps first, fallback to Google Maps
      const appleMapsUrl = generateAppleMapsUrl(coords.lat, coords.lng);
      const googleMapsUrl = generateGoogleMapsUrl(coords.lat, coords.lng);
      
      // Check if we're on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        window.location.href = appleMapsUrl;
      } else {
        window.open(googleMapsUrl, '_blank');
      }
    } else {
      setShowLargeMap(true);
    }
  };

  const handleLargeMapClick = () => {
    if (coords) {
      const googleMapsUrl = generateGoogleMapsUrl(coords.lat, coords.lng);
      window.open(googleMapsUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className={`relative rounded-sq-md bg-muted animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <MapPin className="h-6 w-6 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  if (!coords || !mapImageUrl) {
    return (
      <div className={`relative rounded-sq-md bg-muted border border-border ${className}`}>
        <div className="flex flex-col items-center justify-center h-full min-h-[120px] p-4">
          <MapPin className="h-6 w-6 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground text-center">
            Map unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative rounded-sq-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
        onClick={handleThumbnailClick}
      >
        <img
          src={mapImageUrl}
          alt={`Map of ${clubName} location`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
          {isMobile ? (
            <ExternalLink className="h-3 w-3 text-foreground" />
          ) : (
            <MapPin className="h-3 w-3 text-foreground" />
          )}
        </div>
      </div>

      {/* Large Map Modal - Slides in from right using SlideOver */}
      <SlideOver
        open={showLargeMap}
        onClose={() => setShowLargeMap(false)}
        width="w-[90vw] max-w-[860px]"
        zIndex="z-[1200]"
        heightClass="max-h-[80vh] my-auto"
        ariaLabel="Location map"
        portalTarget="modal-portal"
      >
        <div className="p-3 md:p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-0 pt-0 pb-2">
            <h2 className="text-sm md:text-base font-semibold leading-none tracking-tight flex items-center gap-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5" />
              {clubName} Location
            </h2>
          </div>

          {/* Map: grows to fill available space */}
          <div className="flex-1 rounded-sq-md overflow-hidden border bg-muted/10">
            <div className="w-full h-full bg-muted rounded-sq-sm flex items-center justify-center">
              {largeMapImageUrl ? (
                <img
                  src={largeMapImageUrl}
                  alt={`Large map of ${clubName}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={handleLargeMapClick}
                />
              ) : (
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 px-0 pt-2 pb-0">
            <Button
              variant="outline"
              onClick={handleLargeMapClick}
              className="h-9 rounded-md border flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
              Open in Maps
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLargeMap(false)}
              className="h-9 rounded-md border"
            >
              Close
            </Button>
          </div>
        </div>
      </SlideOver>
    </>
  );
};

export default MapThumbnail;