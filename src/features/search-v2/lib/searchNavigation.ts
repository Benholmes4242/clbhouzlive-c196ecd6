// Per-entity navigation for Search v2. Faithfully mirrors the old
// GlobalSearchOverlay handlers (see src/components/search/GlobalSearchOverlay.tsx):
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
