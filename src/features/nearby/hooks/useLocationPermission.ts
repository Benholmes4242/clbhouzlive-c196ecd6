import { useState, useEffect, useCallback, useMemo } from 'react';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UserLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

// Circuit breaker key for sessionStorage
const CIRCUIT_BREAKER_KEY = 'location_permission_denied';

// Check if circuit breaker is active (permission was denied this session)
function isCircuitBreakerActive(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(CIRCUIT_BREAKER_KEY) === 'true';
}

// Activate circuit breaker (stop all location requests)
function activateCircuitBreaker(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CIRCUIT_BREAKER_KEY, 'true');
  console.log('[LocationPermission] Circuit breaker activated - location requests blocked this session');
}

export function useLocationPermission() {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>(() => {
    // Initialize from circuit breaker state
    if (isCircuitBreakerActive()) return 'denied';
    return 'prompt';
  });
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if geolocation is available
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unavailable');
    } else if (isCircuitBreakerActive()) {
      setPermissionState('denied');
      setError('Location permission denied');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<UserLocation | null> => {
    // Circuit breaker: Stop immediately if permission was denied
    if (isCircuitBreakerActive()) {
      console.log('[LocationPermission] Request blocked by circuit breaker');
      return null;
    }

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
        // PERMISSION_DENIED - Activate circuit breaker
        activateCircuitBreaker();
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
    // Circuit breaker: Don't retry if permission was denied
    if (permissionState === 'denied' || isCircuitBreakerActive()) {
      console.log('[LocationPermission] getCurrentLocation blocked - permission denied');
      return null;
    }

    // Circuit breaker: Don't retry if unavailable
    if (permissionState === 'unavailable') {
      console.log('[LocationPermission] getCurrentLocation blocked - geolocation unavailable');
      return null;
    }

    if (permissionState === 'granted' && currentLocation) {
      // If we recently got location (within 30 seconds), return cached
      if (Date.now() - currentLocation.timestamp < 30000) {
        return currentLocation;
      }
    }
    
    // Only request fresh location if we're in 'prompt' or 'granted' state
    return requestPermission();
  }, [permissionState, currentLocation, requestPermission]);

  return useMemo(() => ({
    permissionState,
    currentLocation,
    error,
    requestPermission,
    getCurrentLocation,
  }), [permissionState, currentLocation, error, requestPermission, getCurrentLocation]);
}
