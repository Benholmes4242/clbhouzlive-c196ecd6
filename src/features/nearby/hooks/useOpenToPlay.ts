import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const STORAGE_KEY = 'clb_open_to_play';
const DURATION_MS = 20 * 60 * 1000; // 20 minutes

export interface OpenToPlayState {
  active: boolean;
  startedAt: number | null;
  expiresAt: number | null;
}

export function useOpenToPlay() {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<OpenToPlayState>(() => {
    if (typeof window === 'undefined') return { active: false, startedAt: null, expiresAt: null };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { active: false, startedAt: null, expiresAt: null };
    
    try {
      const parsed = JSON.parse(stored) as OpenToPlayState;
      // Check if expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return { active: false, startedAt: null, expiresAt: null };
      }
      return parsed;
    } catch {
      return { active: false, startedAt: null, expiresAt: null };
    }
  });

  const { toast } = useToast();

  // Calculate remaining time in minutes
  const getRemainingMinutes = useCallback(() => {
    if (!state.active || !state.expiresAt) return 0;
    const remaining = Math.max(0, state.expiresAt - Date.now());
    return Math.ceil(remaining / 60000);
  }, [state.active, state.expiresAt]);

  // Calculate remaining milliseconds for progress
  const getRemainingMs = useCallback(() => {
    if (!state.active || !state.expiresAt) return 0;
    return Math.max(0, state.expiresAt - Date.now());
  }, [state.active, state.expiresAt]);

  // Activate Open to Play
  const activate = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to activate Open to Play',
        variant: 'destructive',
      });
      return;
    }

    const now = Date.now();
    const newState: OpenToPlayState = {
      active: true,
      startedAt: now,
      expiresAt: now + DURATION_MS,
    };

    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    try {
      // Get current location
      let lat: number | null = null;
      let lng: number | null = null;

      if ('geolocation' in navigator) {
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
          // Continue without location - we'll still set visible_nearby = true
        }
      }

      // Persist to database
      const { error } = await supabase
        .from('user_nearby_status')
        .upsert(
          {
            user_id: user.id,
            visible_nearby: true,
            lat,
            lng,
            last_location_update: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error activating Open to Play:', error);
        toast({
          title: 'Error',
          description: 'Failed to activate Open to Play',
          variant: 'destructive',
        });
        setState({ active: false, startedAt: null, expiresAt: null });
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      toast({
        title: 'Open to Play activated',
        description: "We've let nearby golfers know you're available.",
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
        (window as any).analyticsEvents.track('open2play_tap_activate', { duration: 20 });
      }
    } catch (err) {
      console.error('Error activating Open to Play:', err);
      setState({ active: false, startedAt: null, expiresAt: null });
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.id, toast]);

  // Cancel Open to Play
  const cancel = useCallback(async () => {
    if (!user?.id) return;

    const elapsed = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : 0;

    setState({ active: false, startedAt: null, expiresAt: null });
    localStorage.removeItem(STORAGE_KEY);

    try {
      // Update database to set visible_nearby = false
      const { error } = await supabase
        .from('user_nearby_status')
        .upsert(
          {
            user_id: user.id,
            visible_nearby: false,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error cancelling Open to Play:', error);
      }

      toast({
        title: 'Open to Play cancelled',
        description: 'Your availability ping has been stopped.',
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
        (window as any).analyticsEvents.track('open2play_cancel', { elapsed });
      }
    } catch (err) {
      console.error('Error cancelling Open to Play:', err);
    }
  }, [user?.id, state.startedAt, toast]);

  // Auto-expire when timer runs out
  useEffect(() => {
    if (!state.active || !state.expiresAt) return;

    const remaining = state.expiresAt - Date.now();
    if (remaining <= 0) {
      // Already expired
      const elapsed = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : 0;
      setState({ active: false, startedAt: null, expiresAt: null });
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: 'Open to Play expired',
        description: 'Your availability ping has ended.',
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
        (window as any).analyticsEvents.track('open2play_expire', { elapsed });
      }
      return;
    }

    // Set timeout for expiry
    const timeout = setTimeout(() => {
      const elapsed = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : 0;
      setState({ active: false, startedAt: null, expiresAt: null });
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: 'Open to Play expired',
        description: 'Your availability ping has ended.',
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
        (window as any).analyticsEvents.track('open2play_expire', { elapsed });
      }
    }, remaining);

    return () => clearTimeout(timeout);
  }, [state.active, state.expiresAt, state.startedAt, toast]);

  return {
    isActive: state.active,
    activate,
    cancel,
    getRemainingMinutes,
    getRemainingMs,
    durationMs: DURATION_MS,
  };
}
