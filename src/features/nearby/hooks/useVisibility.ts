import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

export type VisibilityMode = 'all' | 'friends' | 'hidden';

export function useVisibility() {
  const { user } = useSupabaseSession();
  const { getCurrentLocation } = useLocationPermission();

  const [mode, setMode] = useState<VisibilityMode>('hidden');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_nearby_status')
        .select('visibility_mode, visible_nearby')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const derivedMode = data.visibility_mode || (data.visible_nearby === false ? 'hidden' : 'all');
        setMode(derivedMode as VisibilityMode);
      }

      setLoading(false);
    };

    load();
  }, [user?.id]);

  const updateMode = useCallback(
    async (newMode: VisibilityMode) => {
      if (!user?.id) return;

      let lat: number | null = null;
      let lng: number | null = null;

      if (newMode === 'all' || newMode === 'friends') {
        const loc = await getCurrentLocation();
        if (!loc) {
          toast.error('Location needed', {
            description: 'Turn on location to appear to golfers nearby.',
          });
          return;
        }
        lat = loc.lat;
        lng = loc.lng;
      }

      const previousMode = mode;
      setMode(newMode);

      const { error } = await supabase
        .from('user_nearby_status')
        .upsert(
          {
            user_id: user.id,
            visibility_mode: newMode,
            is_hidden: newMode === 'hidden',
            lat: newMode === 'hidden' ? null : lat,
            lng: newMode === 'hidden' ? null : lng,
            last_location_update:
              newMode === 'hidden' ? null : new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('updateMode error', error);
        setMode(previousMode);
        toast.error("Couldn't update visibility");
        return;
      }

      haptic('light');
      toast.success(
        newMode === 'hidden'
          ? 'Hidden from nearby golfers 🙈'
          : newMode === 'friends'
          ? 'Visible to friends only 👥'
          : 'Visible to everyone 👀',
        {
          description:
            newMode === 'hidden'
              ? 'You are hidden from Nearby.'
              : 'Nearby golfers can now see you.',
        }
      );
    },
    [user?.id, mode, getCurrentLocation]
  );

  return {
    visibilityMode: mode,
    setVisibilityMode: updateMode,
    loading,
    visible: mode !== 'hidden',
    setVisible: (v: boolean) => updateMode(v ? 'all' : 'hidden'),
  };
}