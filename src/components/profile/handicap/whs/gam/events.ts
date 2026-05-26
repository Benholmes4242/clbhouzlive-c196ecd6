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
export const notificationsBus = bus<void>();
export const gamAchievementsBus = bus<{ badgeId?: string } | undefined>();
export const leaguesSheetBus = bus<void>();

export const openAllStreaks = () => allStreaksBus.emit();
export const openNotifications = () => notificationsBus.emit();
export const openGamAchievements = (badgeId?: string) => gamAchievementsBus.emit(badgeId ? { badgeId } : undefined);
export const openLeaguesSheet = () => leaguesSheetBus.emit();
