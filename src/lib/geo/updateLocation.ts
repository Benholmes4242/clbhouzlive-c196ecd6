import { supabase } from '@/integrations/supabase/client';

/**
 * Update user's location in the database
 * Uses PostGIS GEOGRAPHY type for efficient spatial queries
 */
export async function upsertLocation({ lat, lng }: { lat: number; lng: number }) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_nearby_status')
    .upsert(
      {
        user_id: user.user.id,
        location: `SRID=4326;POINT(${lng} ${lat})`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to update location:', error);
    throw error;
  }
}

/**
 * Update user's open to play status
 */
export async function updateOpenToPlayStatus(isOpen: boolean) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_nearby_status')
    .upsert(
      {
        user_id: user.user.id,
        open_to_play: isOpen,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to update open to play status:', error);
    throw error;
  }
}

/**
 * Get user's current location with debouncing
 * Uses low-power location tracking suitable for background updates
 */
export function watchUserLocation(
  onLocationUpdate: (coords: { lat: number; lng: number }) => void,
  options: {
    minDistance?: number; // meters before triggering update (default: 100)
    minTime?: number; // ms before triggering update (default: 60000)
  } = {}
): () => void {
  const { minDistance = 100, minTime = 60000 } = options;
  
  let lastUpdate = 0;
  let lastLat: number | null = null;
  let lastLng: number | null = null;
  let watchId: number | null = null;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handlePosition = (position: GeolocationPosition) => {
    const now = Date.now();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Check time threshold
    if (now - lastUpdate < minTime) return;

    // Check distance threshold
    if (lastLat !== null && lastLng !== null) {
      const distance = calculateDistance(lastLat, lastLng, lat, lng);
      if (distance < minDistance) return;
    }

    // Update
    lastUpdate = now;
    lastLat = lat;
    lastLng = lng;
    onLocationUpdate({ lat, lng });
  };

  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      handlePosition,
      (error) => console.error('Location watch error:', error),
      {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 10000,
      }
    );
  }

  // Cleanup function
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
