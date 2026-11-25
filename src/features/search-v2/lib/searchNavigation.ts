// Per-entity navigation for Search v2. Mirrors the historical navigation
// contract from the deprecated global search overlay:
//   person   -> `/profile/${username}`
//   course   -> `/courses/${id}`
//   club     -> `/business/${slug ?? id}` (state: { source: 'search' })
//   player   -> `/tourhub/player/${id}` (same route the Tour Hub uses)
//   video    -> `/post/${id}` (poster-only deep link that opens fullscreen,
//                              same route the comments deep-link uses)
//   post     -> `/post/${id}`
import type { NavigateFunction } from 'react-router-dom';

export type PersonHit = {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url?: string | null;
};
export type CourseHit = {
  id: string;
  name: string;
  country?: string | null;
  sub_country?: string | null;
  avg_rating?: number | null;
  rating_count?: number | null;
};
export type PlayerHit = {
  id: string;
  full_name: string;
  country?: string | null;
  country_code?: string | null;
};
export type ClubHit = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  logo_url?: string | null;
  slug?: string | null;
};
/** Brief 26: `pros` bucket. kind 'pro' → id is the user id, handle the
 *  username; kind 'business' → id is the business id, handle the slug. */
export type ProHit = {
  kind: 'pro' | 'business';
  id: string;
  name: string | null;
  handle?: string | null;
  image_url?: string | null;
  pro_kind?: string | null;
  pro_tour?: string | null;
  pro_club?: string | null;
  category?: string | null;
  city?: string | null;
};
/** Brief 26: `businesses` bucket — every live non-club business. */
export type BusinessHit = {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  city?: string | null;
  country?: string | null;
  category?: string | null;
};
export type VideoHit = {
  id: string;
  media_url?: string | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
  content?: string | null;
  user_id?: string | null;
  created_at?: string | null;
};
export type PostHit = {
  id: string;
  excerpt?: string | null;
  user_id?: string | null;
  created_at?: string | null;
};

export function navPerson(nav: NavigateFunction, p: PersonHit) {
  if (!p.username) return;
  nav(`/profile/${p.username}`);
}
export function navCourse(nav: NavigateFunction, c: CourseHit) {
  nav(`/courses/${c.id}`);
}
export function navClub(nav: NavigateFunction, b: ClubHit) {
  nav(`/business/${b.slug ?? b.id}`, { state: { source: 'search' } });
}
export function navPlayer(nav: NavigateFunction, p: PlayerHit) {
  nav(`/tourhub/player/${p.id}`);
}
export function navPost(nav: NavigateFunction, p: PostHit) {
  nav(`/post/${p.id}`);
}
export function navVideo(nav: NavigateFunction, v: VideoHit) {
  nav(`/post/${v.id}`);
}

/* ── Brief 26 mappers and sub-lines (pure) ─────────────────────────── */

export function proToPerson(p: ProHit): PersonHit {
  return { id: p.id, display_name: p.name, username: p.handle ?? null, profile_photo_url: p.image_url ?? null };
}
export function proToClub(p: ProHit): ClubHit {
  return { id: p.id, name: p.name ?? '', slug: p.handle ?? null, logo_url: p.image_url ?? null, city: p.city ?? null };
}
export function businessToClub(b: BusinessHit): ClubHit {
  return { id: b.id, name: b.name, slug: b.slug ?? null, logo_url: b.logo_url ?? null, city: b.city ?? null, country: b.country ?? null };
}
/** "{category} · {city}", either alone when the other is missing, else null. */
export function categoryCityLine(category?: string | null, city?: string | null): string | null {
  const parts = [category, city].filter((v): v is string => !!v && v.trim().length > 0);
  return parts.length ? parts.join(' · ') : null;
}
/** "Tour pro · {tour}" for tour pros, else "Teaching pro · {club}"; the
 *  " · …" part drops when the value is empty. */
export function proSubline(p: ProHit, labels: { tourPro: string; teachingPro: string }): string {
  const tour = p.pro_kind === 'tour_pro';
  const head = tour ? labels.tourPro : labels.teachingPro;
  const tail = tour ? p.pro_tour : p.pro_club;
  return tail && tail.trim() ? `${head} · ${tail}` : head;
}
