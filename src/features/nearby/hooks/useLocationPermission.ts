import { useState, useEffect, useCallback } from 'react';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UserLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export function useLocationPermission() {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('prompt');
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if geolocation is available
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unavailable');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<UserLocation | null> => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unavailable');
      setError('Geolocation is not supported by your browser');
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const location: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
      };

      setCurrentLocation(location);
      setPermissionState('granted');
      setError(null);
      return location;
    } catch (err: any) {
      console.error('Location permission error:', err);
      
      if (err.code === 1) {
        // PERMISSION_DENIED
        setPermissionState('denied');
        setError('Location permission denied');
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        setError('Location information unavailable');
      } else if (err.code === 3) {
        // TIMEOUT
        setError('Location request timed out');
      } else {
        setError('Failed to get location');
      }
      
      return null;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (permissionState === 'granted' && currentLocation) {
      // If we recently got location (within 30 seconds), return cached
      if (Date.now() - currentLocation.timestamp < 30000) {
        return currentLocation;
      }
    }
    
    // Otherwise request fresh location
    return requestPermission();
  }, [permissionState, currentLocation, requestPermission]);

  return {
    permissionState,
    currentLocation,
    error,
    requestPermission,
    getCurrentLocation,
  };
}
