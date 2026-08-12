import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TITLE } from '@/lib/tokens/type';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, X, Target } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AddressValue } from './AddressAutocomplete';
import { AppLog } from '@/lib/logger';
import { MAP_CONFIG } from '@/config/maps';

// Route through shared MAP_CONFIG so the workerClass override in maps.ts
// is installed before this modal constructs a map.
const MAPBOX_TOKEN = MAP_CONFIG.TOKEN;

interface PinDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: AddressValue) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export const PinDropModal: React.FC<PinDropModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  initialCenter,
  initialZoom = 14,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [reverseGeocodeResult, setReverseGeocodeResult] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!open || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const center = initialCenter || { lat: 51.5074, lng: -0.1278 }; // Default to London
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create draggable marker
    marker.current = new mapboxgl.Marker({
      color: 'hsl(38, 92%, 50%)',
      draggable: true,
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

    setPinPosition(center);

    // Handle marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setPinPosition({ lat: lngLat.lat, lng: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click to move marker
    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setPinPosition({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Initial reverse geocode
    reverseGeocode(center.lat, center.lng);

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [open, initialCenter, initialZoom]);

  // Reverse geocode position to get address label
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setReverseGeocodeResult(data.features[0].place_name);
      } else {
        setReverseGeocodeResult(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (err) {
      AppLog.error('[PinDropModal]', 'Reverse geocode error:', err);
      setReverseGeocodeResult(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Search and fly to location
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current.flyTo({ center: [lng, lat], zoom: 16 });
        marker.current?.setLngLat([lng, lat]);
        setPinPosition({ lat, lng });
        setReverseGeocodeResult(data.features[0].place_name);
      }
    } catch (err) {
      AppLog.error('[PinDropModal]', 'Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!pinPosition) return;

    // Parse reverse geocode result for location components
    let city: string | undefined;
    let country: string | undefined;
    
    if (reverseGeocodeResult) {
      const parts = reverseGeocodeResult.split(', ');
      if (parts.length >= 2) {
        country = parts[parts.length - 1];
        city = parts.length >= 3 ? parts[parts.length - 3] : parts[0];
      }
    }

    const addressValue: AddressValue = {
      label: reverseGeocodeResult || 'Pinned location',
      city,
      country,
      lat: pinPosition.lat,
      lng: pinPosition.lng,
      precision: 'pin',
    };

    onConfirm(addressValue);
    onOpenChange(false);
  };

  // Center on current location
  const handleCenterOnMe = () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.current?.flyTo({ center: [longitude, latitude], zoom: 16 });
        marker.current?.setLngLat([longitude, latitude]);
        setPinPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        AppLog.error('[PinDropModal]', 'Geolocation error:', err);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <DialogTitle style={TITLE}>Drop a pin on the map</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a location..."
                className="pl-9 pr-9 h-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          <button
            type="button"
            onClick={handleCenterOnMe}
            className="text-xs text-[#d97706] hover:underline mt-2 flex items-center gap-1"
          >
            <Target className="h-3 w-3" />
            Use my current location
          </button>
        </div>

        {/* Map container */}
        <div ref={mapContainer} className="flex-1 min-h-0" />

        {/* Footer */}
        <div className="px-4 py-3 border-t flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
                {isReverseGeocoding ? (
                  <span className="text-muted-foreground">Finding address...</span>
                ) : (
                  <span className="truncate">{reverseGeocodeResult || 'Drag the pin to your location'}</span>
                )}
              </div>
            </div>
            <Button onClick={handleConfirm} disabled={!pinPosition} className="bg-[#f59e0b] hover:bg-[#e8920f] text-white border-0">
              Use this location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDropModal;
