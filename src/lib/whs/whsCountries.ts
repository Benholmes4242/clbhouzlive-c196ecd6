export interface WhsCountry {
  /** Stable ID used in localStorage. */
  id: string;
  /** Display name. */
  name: string;
  /** ISO-3166 alpha-2 — used only for the flag SVG component. */
  iso: string;
  /** Governing body name shown in the picker and pill. */
  body: string;
  /** Short marketing line for the connect form header. */
  bodyShort?: string;
  /** True when the user can actually log in via this body today. */
  supported: boolean;
}

export const WHS_COUNTRIES: WhsCountry[] = [
  {
    id: 'gb-eng',
    name: 'England',
    iso: 'GB-ENG',
    body: 'England Golf',
    bodyShort: 'MyEG',
    supported: true,
  },
  { id: 'au',     name: 'Australia',     iso: 'AU', body: 'Golf Australia',                       supported: false },
  { id: 'ca',     name: 'Canada',        iso: 'CA', body: 'Golf Canada',                          supported: false },
  { id: 'fr',     name: 'France',        iso: 'FR', body: 'Fédération Française de Golf',         supported: false },
  { id: 'de',     name: 'Germany',       iso: 'DE', body: 'Deutscher Golf Verband',               supported: false },
  { id: 'ie',     name: 'Ireland',       iso: 'IE', body: 'Golf Ireland',                         supported: false },
  { id: 'it',     name: 'Italy',         iso: 'IT', body: 'Federazione Italiana Golf',            supported: false },
  { id: 'nl',     name: 'Netherlands',   iso: 'NL', body: 'NGF',                                  supported: false },
  { id: 'nz',     name: 'New Zealand',   iso: 'NZ', body: 'NZ Golf',                              supported: false },
  { id: 'pt',     name: 'Portugal',      iso: 'PT', body: 'Federação Portuguesa de Golfe',        supported: false },
  { id: 'gb-sct', name: 'Scotland',      iso: 'GB-SCT', body: 'Scottish Golf',                    supported: false },
  { id: 'za',     name: 'South Africa',  iso: 'ZA', body: 'GolfRSA',                              supported: false },
  { id: 'es',     name: 'Spain',         iso: 'ES', body: 'Federación Española de Golf',          supported: false },
  { id: 'se',     name: 'Sweden',        iso: 'SE', body: 'Svenska Golfförbundet',                supported: false },
  { id: 'ch',     name: 'Switzerland',   iso: 'CH', body: 'Swiss Golf',                           supported: false },
  { id: 'us',     name: 'United States', iso: 'US', body: 'USGA / GHIN',                          supported: false },
  { id: 'gb-wls', name: 'Wales',         iso: 'GB-WLS', body: 'Wales Golf',                       supported: false },
];

export function getCountryById(id: string | null): WhsCountry | null {
  if (!id) return null;
  return WHS_COUNTRIES.find(c => c.id === id) ?? null;
}
