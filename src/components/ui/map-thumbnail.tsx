import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapThumbnailProps {
  clubId: string;
  clubName: string;
  region?: string;
  country: string;
  subCountry?: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

const MapThumbnail = ({
  clubId,
  clubName,
  region,
  country,
  subCountry,
  latitude,
  longitude,
  className = ''
}: MapThumbnailProps) => {
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [showLargeMap, setShowLargeMap] = React.useState(false);
  const [mapImageUrl, setMapImageUrl] = React.useState<string | null>(null);
  const [largeMapImageUrl, setLargeMapImageUrl] = React.useState<string | null>(null);
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const generateMapUrl = async (lat: number, lng: number, size: string, zoom: number = 13): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-map-url', {
        body: {
          latitude: lat,
          longitude: lng,
          size,
          zoom
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
        toast({
          title: "Geocoding failed",
          description: "Could not find location for this club",
          variant: "destructive"
        });
        return;
      }

      if (data?.latitude && data?.longitude) {
        const newCoords = { lat: data.latitude, lng: data.longitude };
        setCoords(newCoords);
      }
    } catch (error) {
      console.error('Error geocoding club:', error);
      toast({
        title: "Error",
        description: "Failed to geocode club location",
        variant: "destructive"
      });
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
          generateMapUrl(coords.lat, coords.lng, thumbnailSize),
          generateMapUrl(coords.lat, coords.lng, largeSize, 15)
        ]);
        
        setMapImageUrl(thumbnailUrl);
        setLargeMapImageUrl(largeUrl);
      }
    };

    generateMapUrls();
  }, [coords, isMobile]);

  // Find the portal element inside ProfileModalRouter
  React.useEffect(() => {
    setPortalEl(document.getElementById('modal-portal'));
  }, []);

  // Attempt to geocode on mount if no coordinates
  React.useEffect(() => {
    if (!coords && !isLoading) {
      geocodeClub();
    }
  }, [clubId]);

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
      <div className={`relative rounded-2xl bg-muted animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <MapPin className="h-6 w-6 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  if (!coords || !mapImageUrl) {
    return (
      <div className={`relative rounded-2xl bg-muted border border-border ${className}`}>
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
        className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
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

      {/* Large Map Modal for Desktop */}
      <DialogPrimitive.Root open={showLargeMap} onOpenChange={setShowLargeMap}>
        {portalEl && (
          <DialogPrimitive.Portal container={portalEl}>
            <DialogPrimitive.Overlay
              className="fixed inset-0 z-[1001] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out"
              onClick={() => setShowLargeMap(false)}
            />
            <DialogPrimitive.Content
              className="fixed left-1/2 top-1/2 z-[1002] grid w-full max-w-4xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background shadow-2xl outline-none"
            >
              {/* Header */}
              <div className="flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0">
                <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {clubName} Location
                </h2>
              </div>
              
              {/* Content */}
              <div className="relative p-6">
                {largeMapImageUrl && (
                  <img
                    src={largeMapImageUrl}
                    alt={`Detailed map of ${clubName} location`}
                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleLargeMapClick}
                  />
                )}
                <Button
                  onClick={handleLargeMapClick}
                  className="absolute bottom-10 right-10 bg-background/90 hover:bg-background text-foreground border"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </div>
              
              {/* Close button */}
              <button
                aria-label="Close"
                className="absolute right-3 top-3"
                onClick={() => setShowLargeMap(false)}
              >
                ✕
              </button>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </DialogPrimitive.Root>
    </>
  );
};

export default MapThumbnail;