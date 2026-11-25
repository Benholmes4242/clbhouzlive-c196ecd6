/** Brief 26: FindPeople merge of a 'directory' response into its existing
 *  people/club row shapes. */
import type { SearchBuckets } from '../hooks/useGlobalSearchV2';
import { businessToClub, proToClub, proToPerson, type ClubHit, type PersonHit } from './searchNavigation';

type Dir = Partial<Pick<SearchBuckets, 'people' | 'pros' | 'clubs' | 'businesses'>>;
const arr = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);

export function directoryPeople(d: Dir): PersonHit[] {
  return [...arr(d.people), ...arr(d.pros).filter((p) => p.kind === 'pro').map(proToPerson)];
}
export function directoryBusinesses(d: Dir): ClubHit[] {
  return [
    ...arr(d.clubs),
    ...arr(d.pros).filter((p) => p.kind === 'business').map(proToClub),
    ...arr(d.businesses).map(businessToClub),
  ];
}
