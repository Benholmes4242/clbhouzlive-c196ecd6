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
      // Check permission state first to avoid repeated prompts/errors
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setPermissionState('denied');
          setError('Location permission denied');
          return null;
        }
      } catch (permError) {
        // permissions.query not supported on all browsers, continue
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, 8000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 300000,
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
      // Silently handle errors to prevent console spam that crashes iOS Safari
      if (err?.code === 1 || err?.message?.includes('denied')) {
        setPermissionState('denied');
        setError('Location permission denied');
      } else if (err?.code === 2) {
        setError('Location information unavailable');
      } else if (err?.code === 3 || err?.message?.includes('TIMEOUT')) {
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
