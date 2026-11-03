import type { PickFieldPlayer } from '../../../hooks/useTournamentPick';

export function searchPickField(field: PickFieldPlayer[], query: string) {
  const needle = query.trim().toLowerCase();
  return field.filter(player => player.full_name.toLowerCase().split(/[\s.-]+/).some(part => part.startsWith(needle)));
}

export function localPickLock(locksAt: string | null): { time: string; day: string } | null {
  if (!locksAt) return null;
  const date = new Date(locksAt);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
    day: new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date),
  };
}

export function pickCountry(country: string | null) {
  return country?.toLowerCase().replace(/\b\p{L}/gu, letter => letter.toUpperCase()) ?? '';
}