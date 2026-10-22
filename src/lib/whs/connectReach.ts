/**
 * The one source for the "Works with official handicaps..." sentence, used
 * by the connect page end block and the Rounds gate sheet.
 */
import { WHS_COUNTRIES } from './whsCountries';

export function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function connectReach(): { live: string; count: number } {
  return {
    live: joinNames(WHS_COUNTRIES.filter((c) => c.supported).map((c) => c.name)),
    count: WHS_COUNTRIES.filter((c) => !c.supported).length,
  };
}