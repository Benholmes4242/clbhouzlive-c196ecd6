/**
 * CB112 — pure rules for the non-club business hero (ClubProfileHero reused):
 * category word, second pill and figure strip. Kept pure so every rule is
 * tested directly and the page only wires handlers.
 */
type T = (key: string, fallback: string) => string;

const WORDS: Record<string, [string, string]> = {
  'Golf Academy': ['business.hero.word.academy', 'Golf academy'],
  'Coach / Instructor': ['business.hero.word.coach', 'Golf coach'],
  'Driving Range': ['business.hero.word.range', 'Driving range'],
  'Club Fitter': ['business.hero.word.fitter', 'Club fitter'],
  'Retailer / Pro Shop': ['business.hero.word.shop', 'Golf shop'],
  Resort: ['business.hero.word.resort', 'Golf resort'],
  'Hotel / Accommodation': ['business.hero.word.hotel', 'Hotel'],
  'Restaurant / Cafe': ['business.hero.word.restaurant', 'Restaurant'],
  'Bar / Pub': ['business.hero.word.bar', 'Bar'],
  'Brand / Manufacturer': ['business.hero.word.brand', 'Brand'],
  Creator: ['business.hero.word.creator', 'Creator'],
  'University / College': ['business.hero.word.university', 'University golf'],
};

/** Exact-match category word; Other, null or unknown → ''. */
export function businessCategoryWord(category: string | null | undefined, t: T): string {
  const w = category ? WORDS[category] : undefined;
  return w ? t(w[0], w[1]) : '';
}

/** "{word} · {place}", dropping empty parts; '' when both are empty. */
export function businessPlaceLine(word: string, place: string): string {
  return [word, place].filter(Boolean).join(' \u00B7 ');
}

export type SecondKind = 'book' | 'soon' | 'website' | 'call' | 'email' | 'directions';
export interface SecondPill { kind: SecondKind; label: string; arrow: boolean; soonToast?: string }

export interface SecondInput {
  category?: string | null;
  booking_url?: string | null;
  primary_action?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const LESSON = new Set(['Golf Academy', 'Coach / Instructor']);

/** CB112 §3 — first rule that applies: (a) booking link, (b) Soon, (c) promoted contact, (d) none. */
export function businessSecondPill(b: SecondInput, t: T): SecondPill | null {
  const c = b.category ?? '';
  if (b.booking_url) {
    const label =
      c === 'Hotel / Accommodation' || c === 'Resort' ? t('business.hero.bookStay', 'Book a stay')
      : c === 'Restaurant / Cafe' || c === 'Bar / Pub' ? t('business.hero.bookTable', 'Book a table')
      : LESSON.has(c) ? t('business.hero.bookLesson', 'Book a lesson')
      : c === 'Driving Range' ? t('business.hero.bookBay', 'Book a bay')
      : t('business.hero.book', 'Book');
    return { kind: 'book', label, arrow: true };
  }
  if (LESSON.has(c)) return { kind: 'soon', label: t('business.hero.bookLesson', 'Book a lesson'), arrow: false, soonToast: t('business.hero.lessonSoon', 'Lesson booking is coming soon.') };
  if (c === 'Driving Range') return { kind: 'soon', label: t('business.hero.bookBay', 'Book a bay'), arrow: false, soonToast: t('business.hero.baySoon', 'Bay booking is coming soon.') };
  const pa = b.primary_action;
  if (pa === 'website' && b.website) return { kind: 'website', label: t('business.hero.website', 'Website'), arrow: true };
  if (pa === 'call' && b.phone) return { kind: 'call', label: t('business.hero.call', 'Call'), arrow: false };
  if (pa === 'email' && b.email) return { kind: 'email', label: t('business.hero.email', 'Email'), arrow: false };
  if (pa === 'directions' && (b.location || (b.lat != null && b.lng != null))) return { kind: 'directions', label: t('business.hero.directions', 'Directions'), arrow: true };
  return null;
}

/** Categories whose strip leads with nearby courses. */
export const NEARBY_CATEGORIES = new Set(['Hotel / Accommodation', 'Resort', 'Restaurant / Cafe', 'Bar / Pub', 'Driving Range']);

export type StripKey = 'coursesNear' | 'top100Near' | 'followers' | 'posts';
export interface StripCandidate { key: StripKey; value: number | null | undefined }

/** CB112 §5 — ordered candidates, zero/unavailable skipped, first three kept. */
export function businessStripKeys(
  category: string | null | undefined,
  v: { coursesNear?: number | null; top100Near?: number | null; followers?: number | null; posts?: number | null },
): StripKey[] {
  const order: StripKey[] = NEARBY_CATEGORIES.has(category ?? '')
    ? ['coursesNear', 'top100Near', 'followers', 'posts']
    : ['followers', 'posts'];
  return order.filter((k) => (v[k] ?? 0) > 0).slice(0, 3);
}
