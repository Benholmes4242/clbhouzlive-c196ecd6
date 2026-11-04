/** One above-Coming-up selection owns Also this week's eligibility/cap and
 * all hero-river exclusions. Coming up's ordering also runs before the fetch
 * cap so same-day purse/tour ties cannot disappear at the catalogue boundary. */
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { tourPriorityIndex } from '../../_shared/tourOrder';

export function isAlsoThisWeek(slide: HeroSlide, now = new Date()): boolean {
  if (slide.type === 'live') return true;
  if (slide.type === 'completed') {
    const age = now.getTime() - new Date(slide.tournament.endDate).getTime();
    return Number.isFinite(age) && age >= 0 && age < 3 * 86_400_000;
  }
  if (slide.type !== 'upcoming') return false;
  const start = new Date(slide.tournament.startDate);
  if (Number.isNaN(start.getTime()) || start.getTime() < now.getTime()) return false;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  return start.getTime() <= sunday.getTime();
}

export function selectOverviewEventsAbove(slides: HeroSlide[], viewingId: string | null, now = new Date()) {
  const alsoWeek = slides.filter(slide => slide.tournament.id !== viewingId && isAlsoThisWeek(slide, now)).slice(0, 4);
  const usedIds = [...new Set([...slides, ...alsoWeek].map(slide => slide.tournament.id))];
  return { alsoWeek, usedIds };
}

export function compareComingUpEvents(
  a: { start_date: string; purse: number | null; tour_slug: string },
  b: { start_date: string; purse: number | null; tour_slug: string },
) {
  const dateOrder = (a.start_date ?? '').slice(0, 10).localeCompare((b.start_date ?? '').slice(0, 10));
  if (dateOrder) return dateOrder;
  if (a.purse == null && b.purse != null) return 1;
  if (a.purse != null && b.purse == null) return -1;
  return (b.purse ?? 0) - (a.purse ?? 0) || tourPriorityIndex(a.tour_slug) - tourPriorityIndex(b.tour_slug);
}