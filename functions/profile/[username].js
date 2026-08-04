import {
  wantsPreview,
  restSelect,
  metaDocument,
  genericDocument,
  canonicalUrl,
} from '../_lib/og.js';

export async function onRequest(context) {
  const { request, params, next } = context;
  if (!wantsPreview(request)) return next();

  const username = String(params.username || '').trim();
  if (!username || !/^[A-Za-z0-9._-]{1,64}$/.test(username)) return genericDocument(request);

  // public_profiles only exposes non-deleted, public profiles - exactly what a
  // logged-out visitor already sees. No handicap index here, ever.
  const rows = await restSelect(
    `public_profiles?select=display_name,username,profile_photo_url,home_club,city,country&username=eq.${encodeURIComponent(
      username,
    )}&limit=1`,
  );
  const profile = rows[0];
  if (!profile) return genericDocument(request);

  const title = profile.display_name || profile.username;
  if (!title) return genericDocument(request);

  const facts = [profile.home_club, profile.country]
    .map((part) => (part ? String(part).trim() : ''))
    .filter(Boolean)
    .filter((part, i, arr) => arr.indexOf(part) === i);

  return metaDocument({
    title,
    description: facts.length ? facts.join(' - ') : undefined,
    image: profile.profile_photo_url || undefined,
    type: 'profile',
    url: canonicalUrl(request),
  });
}
