import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

const DURATION_MINUTES = 30;
const STORAGE_KEY = 'open_to_play_state_v2';

type OpenState = {
  active: boolean;
  expiresAt: number | null; // ms timestamp
};

export function useOpenToPlay() {
  const { user } = useSupabaseSession();
  const { getCurrentLocation } = useLocationPermission();
  

  // local cache so UI can render instantly
  const [state, setState] = useState<OpenState>(() => {
    if (typeof window === 'undefined') {
      return { active: false, expiresAt: null };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { active: false, expiresAt: null };
      const parsed = JSON.parse(raw) as OpenState;
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        return { active: false, expiresAt: null };
      }
      return parsed;
    } catch {
      return { active: false, expiresAt: null };
    }
  });

  // helper to persist local cache
  const persistLocal = (next: OpenState) => {
    setState(next);
    if (next.active) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Activate broadcast with optimistic UI
  const activate = useCallback(async () => {
    if (!user?.id) return;

    // STEP 1: Check visibility FIRST - cannot be Open to Play when hidden
    const { data: statusData } = await supabase
      .from('user_nearby_status')
      .select('visibility_mode, visible_nearby')
      .eq('user_id', user.id)
      .maybeSingle();

    // Check visibility_mode or visible_nearby to ensure consistency
    const isHidden = statusData?.visibility_mode === 'hidden' || statusData?.visible_nearby === false;
    if (isHidden) {
      toast.error('Change visibility first', { description: 'You need to be visible to use Open to Play.' });
      return;
    }

    // STEP 2: Check location SECOND before any UI update
    const loc = await getCurrentLocation();
    if (!loc) {
      // Block immediately - no optimistic update
      toast.error('Location needed', { description: 'Turn on location to go Open to Play.' });
      return;
    }

    const expiresAtMs = Date.now() + DURATION_MINUTES * 60_000;

    // STEP 3: Now do optimistic UI update (visibility and location are OK)
    persistLocal({
      active: true,
      expiresAt: expiresAtMs,
    });

    const expiresAtISO = new Date(expiresAtMs).toISOString();

    // upsert user_nearby_status: mark open_to_play_active=true, set expiry/time, refresh lat/lng
    const { error } = await supabase
      .from('user_nearby_status')
      .upsert(
        {
          user_id: user.id,
          // ensure DB sees current visibility state to satisfy trigger
          visibility_mode: statusData?.visibility_mode || 'all',
          is_hidden: false,
          open_to_play_active: true,
          open_to_play_expires_at: expiresAtISO,
          lat: loc.lat,
          lng: loc.lng,
          last_location_update: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('OpenToPlay activate error', error);
      // REVERT on failure
      persistLocal({
        active: false,
        expiresAt: null,
      });
      toast.error('Error', { description: 'Could not set Open to Play.' });
      return;
    }

    // Success toast + haptic
    haptic('medium');
    toast.success('Open to Play Active', { description: 'Nearby golfers can see you are available for the next 30 mins.' });
  }, [user?.id, getCurrentLocation]);

  // Cancel broadcast with optimistic UI
  const cancel = useCallback(async () => {
    if (!user?.id) return;

    // Store previous state for rollback
    const previousState = { ...state };

    // OPTIMISTIC: Update UI immediately
    persistLocal({
      active: false,
      expiresAt: null,
    });

    const { error } = await supabase
      .from('user_nearby_status')
      .upsert(
        {
          user_id: user.id,
          open_to_play_active: false,
          open_to_play_expires_at: null,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('OpenToPlay cancel error', error);
      // REVERT on failure
      persistLocal(previousState);
      toast.error('Error', { description: 'Could not clear Open to Play.' });
      return;
    }

    // Success toast + haptic
    haptic('light');
    toast.success('Open to Play off', { description: 'You are no longer broadcasting availability.' });
  }, [user?.id, state]);

  // Auto-expire locally and in DB when the timer runs out
  useEffect(() => {
    if (!state.active || !state.expiresAt) return;
    const msLeft = state.expiresAt - Date.now();
    if (msLeft <= 0) {
      cancel();
      return;
    }
    const t = setTimeout(() => {
      cancel();
    }, msLeft);
    return () => clearTimeout(t);
  }, [state.active, state.expiresAt, cancel]);

  // Helper for UI label like "18m left"
  const remainingText = (() => {
    if (!state.active || !state.expiresAt) return null;
    const diffMs = state.expiresAt - Date.now();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    return `${mins}m left`;
  })();

  return {
    isOpen: state.active,
    remainingText,
    activate,
    cancel,
    // legacy compat
    isActive: state.active,
    getRemainingMinutes: () => {
      if (!state.active || !state.expiresAt) return 0;
      const diffMs = state.expiresAt - Date.now();
      return Math.max(0, Math.floor(diffMs / 60000));
    },
    getRemainingMs: () => {
      if (!state.active || !state.expiresAt) return 0;
      return Math.max(0, state.expiresAt - Date.now());
    },
    durationMs: DURATION_MINUTES * 60_000,
  };
}
