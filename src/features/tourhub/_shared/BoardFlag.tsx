/** Brief 44 — the one leaderboard flag: World rankings' CountryFlag (sm, 16×12, radius 2, no
 * border), flex none, after the name. `offset` tops up the row's own gap to 8px. No country:
 * nothing at all (no element, no gap). */
import CountryFlag from '@/components/ui/country-flag';

export function BoardFlag({ country, offset = 0 }: { country: string | null | undefined; offset?: number }) {
  if (!country || !String(country).trim()) return null;
  return <span data-board-flag style={{ display: 'inline-flex', flex: 'none', alignItems: 'center', marginLeft: offset || undefined }}>
    <CountryFlag country={country} size="sm" className="border-none" />
  </span>;
}

export const boardCountry = (p: { country_code?: string | null; country?: string | null } | null | undefined) => p?.country_code ?? p?.country ?? null;
