import { useState, useEffect, useCallback } from 'react';
import { LIVE_CLUBHOUSE_DATA } from '../config';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'clb_open_to_play';
const DURATION_MS = 20 * 60 * 1000; // 20 minutes

export interface OpenToPlayState {
  active: boolean;
  startedAt: number | null;
  expiresAt: number | null;
}

export function useOpenToPlay() {
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
    const now = Date.now();
    const newState: OpenToPlayState = {
      active: true,
      startedAt: now,
      expiresAt: now + DURATION_MS,
    };

    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /presence/open2play
      console.log('POST /presence/open2play', { active: true, expiresAt: newState.expiresAt });
    } else {
      console.log('Mock Open to Play activated', newState);
    }

    toast({
      title: 'Open to Play activated',
      description: "We've let nearby golfers know you're available.",
    });

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
      (window as any).analyticsEvents.track('open2play_tap_activate', { duration: 20 });
    }
  }, [toast]);

  // Cancel Open to Play
  const cancel = useCallback(async () => {
    const elapsed = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : 0;

    setState({ active: false, startedAt: null, expiresAt: null });
    localStorage.removeItem(STORAGE_KEY);

    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /presence/open2play
      console.log('POST /presence/open2play', { active: false });
    } else {
      console.log('Mock Open to Play cancelled');
    }

    toast({
      title: 'Open to Play cancelled',
      description: 'Your availability ping has been stopped.',
    });

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).analyticsEvents) {
      (window as any).analyticsEvents.track('open2play_cancel', { elapsed });
    }
  }, [state.startedAt, toast]);

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
