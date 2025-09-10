import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showLargeMap, setShowLargeMap] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [largeMapImageUrl, setLargeMapImageUrl] = useState<string | null>(null);
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
  useEffect(() => {
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

  // Attempt to geocode on mount if no coordinates
  useEffect(() => {
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
      <Dialog open={showLargeMap} onOpenChange={setShowLargeMap}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {clubName} Location
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
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
              className="absolute bottom-4 right-4 bg-background/90 hover:bg-background text-foreground border"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapThumbnail;