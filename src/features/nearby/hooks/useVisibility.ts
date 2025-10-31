import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { useToast } from '@/hooks/use-toast';

export type VisibilityMode = 'all' | 'friends' | 'hidden';

export function useVisibility() {
  const { user } = useSupabaseSession();
  const { getCurrentLocation } = useLocationPermission();
  const { toast } = useToast();

  const [mode, setMode] = useState<VisibilityMode>('hidden');
  const [loading, setLoading] = useState(true);

  // Load current visibility state from DB
  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_nearby_status')
        .select('visibility_mode')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.visibility_mode) {
        console.log('[🔍 VISIBILITY DEBUG] Loaded visibility mode:', data.visibility_mode);
        setMode(data.visibility_mode as VisibilityMode);
      } else {
        console.log('[🔍 VISIBILITY DEBUG] No visibility mode in DB, using default "hidden"');
      }

      setLoading(false);
    };

    load();
  }, [user?.id]);

  // Update mode in DB with optimistic UI
  const updateMode = useCallback(
    async (newMode: VisibilityMode) => {
      if (!user?.id) return;

      let lat: number | null = null;
      let lng: number | null = null;

      // STEP 1: Check location FIRST before any UI update
      if (newMode === 'all' || newMode === 'friends') {
        // must have a location in these modes
        const loc = await getCurrentLocation();
        if (!loc) {
          // Block immediately - no optimistic update
          toast({
            title: 'Location needed',
            description: 'Turn on location to appear to golfers nearby.',
            variant: 'destructive',
          });
          return;
        }
        lat = loc.lat;
        lng = loc.lng;
      }

      // Store previous mode for rollback
      const previousMode = mode;

      // STEP 2: Now do optimistic UI update (location is OK or mode is 'hidden')
      setMode(newMode);
      
      console.log('[🔍 VISIBILITY DEBUG] Updating DB:', {
        user_id: user.id,
        visibility_mode: newMode,
        lat: newMode === 'hidden' ? null : lat,
        lng: newMode === 'hidden' ? null : lng,
        last_location_update: newMode === 'hidden' ? null : new Date().toISOString()
      });

      // If hidden, we deliberately blank coords
      const { data: updatedRow, error } = await supabase
        .from('user_nearby_status')
        .upsert(
          {
            user_id: user.id,
            visibility_mode: newMode,
            lat: newMode === 'hidden' ? null : lat,
            lng: newMode === 'hidden' ? null : lng,
            last_location_update:
              newMode === 'hidden' ? null : new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('*')
        .single();
      
      console.log('[🔍 VISIBILITY DEBUG] DB upsert result:', { data: updatedRow, error });

      if (error) {
        console.error('updateMode error', error);
        // REVERT on failure
        setMode(previousMode);
        toast({
          title: 'Error',
          description: 'Could not update visibility.',
          variant: 'destructive',
        });
        return;
      }

      // Success toast
      toast({
        title:
          newMode === 'hidden'
            ? 'Hidden from nearby golfers 🙈'
            : newMode === 'friends'
            ? 'Visible to friends only 👥'
            : 'Visible to everyone 👀',
        description:
          newMode === 'hidden'
            ? 'You are hidden from Nearby.'
            : 'Nearby golfers can now see you.',
      });
    },
    [user?.id, mode, getCurrentLocation, toast]
  );

  return {
    visibilityMode: mode,
    setVisibilityMode: updateMode,
    loading,
    // legacy compat
    visible: mode !== 'hidden',
    setVisible: (v: boolean) => updateMode(v ? 'all' : 'hidden'),
  };
}
