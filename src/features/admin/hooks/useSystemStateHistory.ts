import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_system_state_history - a SLOWER, second view of the same six subsystems
 * the board's tiles show live. The two are deliberately independent: a bar's
 * final day disagreeing with its tile is a real signal, not a bug to smooth
 * over in the client. Nothing here may be used to compute a tile's tone.
 *
 * NULL IS NOT A STATE. It means nothing was recorded for that subsystem that
 * day, and must never render in a state colour.
 */
export type SystemDayState = 'ok' | 'warn' | 'danger' | 'idle' | null;

export interface SystemStateSeries {
  subsystem: string;
  recorded_days: number;
  /** OLDEST FIRST, length = window_days. */
  days: Array<SystemDayState>;
}

export interface SystemStateChange {
  subsystem: string;
  tone: 'ok' | 'warn' | 'danger' | 'idle';
  detail: string;
  at: string;
}

export interface SystemStateHistory {
  window_days: number;
  computed_at: string;
  systems: SystemStateSeries[];
  changes: SystemStateChange[];
}

const STATES = new Set(['ok', 'warn', 'danger', 'idle']);

function normaliseDay(v: unknown): SystemDayState {
  return typeof v === 'string' && STATES.has(v) ? (v as SystemDayState) : null;
}

export function useSystemStateHistory(days = 90) {
  return useQuery<SystemStateHistory>({
    queryKey: ['admin-v2', 'system-state-history', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_state_history', { p_days: days });
      if (error) throw error;
      const raw = (data ?? {}) as any;

      // A missing systems[] must leave the section LOADING, never empty: an
      // empty history panel reads as "no incidents ever", which is a lie.
      if (!Array.isArray(raw.systems)) throw new Error('system state history unavailable');

      return {
        window_days: Number(raw.window_days) || days,
        computed_at: String(raw.computed_at ?? ''),
        systems: raw.systems.map((s: any): SystemStateSeries => ({
          subsystem: String(s?.subsystem ?? ''),
          recorded_days: Number(s?.recorded_days) || 0,
          days: Array.isArray(s?.days) ? s.days.map(normaliseDay) : [],
        })),
        changes: Array.isArray(raw.changes)
          ? raw.changes.map((c: any): SystemStateChange => ({
              subsystem: String(c?.subsystem ?? ''),
              tone: STATES.has(c?.tone) ? c.tone : 'idle',
              detail: String(c?.detail ?? ''),
              at: String(c?.at ?? ''),
            }))
          : [],
      };
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

/**
 * The trailing run in days[] - how long the current state has held. Derived
 * here, not from a second query.
 */
export function trailingRun(days: Array<SystemDayState>): { state: SystemDayState; length: number } {
  if (!days.length) return { state: null, length: 0 };
  const state = days[days.length - 1];
  let length = 0;
  for (let i = days.length - 1; i >= 0 && days[i] === state; i--) length++;
  return { state, length };
}
