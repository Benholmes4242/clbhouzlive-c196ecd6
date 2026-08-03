/**
 * Lightweight event bus for gam_* surfaces opened from the page header.
 *
 * The HandicapPage header buttons fire these events; mount components
 * (see GamMount.tsx) subscribe and own sheet state.
 */
type Listener<T = void> = (payload: T) => void;

function bus<T = void>() {
  const set = new Set<Listener<T>>();
  return {
    emit: (p: T) => set.forEach(fn => fn(p)),
    subscribe: (fn: Listener<T>) => {
      set.add(fn);
      return () => {
        set.delete(fn);
      };
    },
  };
}

export const allStreaksBus = bus<void>();
// notificationsBus retired with NotificationsSheet: game events now live in
// the Activity ledger (/notificationmessages?filter=crowns), which reads the
// notifications table rather than querying gam_* source tables in parallel.
export const gamAchievementsBus = bus<{ badgeId?: string; section?: 'crowns' } | undefined>();

export const openAllStreaks = () => allStreaksBus.emit();

export const openGamAchievements = (
  opts?: { badgeId?: string; section?: 'crowns' },
) => gamAchievementsBus.emit(opts && (opts.badgeId || opts.section) ? opts : undefined);

