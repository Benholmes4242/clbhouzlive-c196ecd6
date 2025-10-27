import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export function useVisibility() {
  const { user } = useSupabaseSession();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial visibility status from database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_nearby_status')
          .select('visible_nearby')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching visibility status:', error);
        } else if (data) {
          setVisible(data.visible_nearby);
        }
      } catch (err) {
        console.error('Error loading visibility:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user?.id]);

  const updateVisibility = async (newValue: boolean) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update visibility',
        variant: 'destructive',
      });
      return;
    }

    setVisible(newValue);

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      // If turning visibility ON, get current location
      if (newValue && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoError) {
          console.error('Error getting location:', geoError);
          toast({
            title: 'Location unavailable',
            description: 'Unable to get your location. You may need to enable location permissions.',
            variant: 'destructive',
          });
          setVisible(false);
          return;
        }
      }

      // Upsert visibility status
      const { error } = await supabase
        .from('user_nearby_status')
        .upsert(
          {
            user_id: user.id,
            visible_nearby: newValue,
            lat: newValue ? lat : null,
            lng: newValue ? lng : null,
            last_location_update: newValue ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error updating visibility:', error);
        setVisible(!newValue); // Revert on error
        toast({
          title: 'Error',
          description: 'Failed to update visibility status',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Online visibility updated',
        description: newValue
          ? 'You are now visible to nearby players'
          : 'You are now hidden from nearby players',
      });
    } catch (err) {
      console.error('Error updating visibility:', err);
      setVisible(!newValue);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return { visible, setVisible: updateVisibility, loading };
}
