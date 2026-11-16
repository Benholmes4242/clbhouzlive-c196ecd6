import { playDateAtLocalNoon } from '@/components/explore-tab-new/courseled/discoverWhen';

/** The round tile foot's short play date (RoundTileParts); the Standout shelf it was named for is retired. */
export function shortStandoutDate(iso: string | null, locale = 'en', now = new Date()) {
  const date = iso ? playDateAtLocalNoon(iso) : null;
  return date ? date.toLocaleDateString(locale, { month: 'short', day: 'numeric', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}) }) : '';
}
