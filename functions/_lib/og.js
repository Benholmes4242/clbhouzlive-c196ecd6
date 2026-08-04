/**
 * Shared helpers for the crawler-only link-preview Functions.
 *
 * Anonymous key only. RLS decides what a crawler can see; when a row is not
 * anon-readable we fall through to the generic clbhouz card.
 */

export const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw';

export const SITE_ORIGIN = 'https://clbhouz.co.uk';
export const GENERIC_IMAGE = SITE_ORIGIN + '/og-card.png';
export const GENERIC_TITLE = 'clbhouz | the home of golf courses';
export const GENERIC_DESCRIPTION =
  'clbhouz - the home of golf courses. Every course in the world, gathered into one place, rated and brought to life.';

const CRAWLER_TOKENS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'slackbot',
  'linkedinbot',
  'whatsapp',
  'discordbot',
  'telegrambot',
  'applebot',
  'redditbot',
  'pinterest',
  'skypeuripreview',
  'vkshare',
  'w3c_validator',
  'googlebot',
  'bingbot',
];

/** True only when the UA clearly belongs to a preview crawler. */
export function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = String(userAgent).toLowerCase();
  return CRAWLER_TOKENS.some((token) => ua.includes(token));
}

/** Debug override: ?_og=1 renders the meta document in a normal browser. */
export function wantsPreview(request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('_og') === '1') return true;
  } catch {
    /* fall through */
  }
  return isCrawler(request.headers.get('user-agent'));
}

/** Escape for both HTML text and double-quoted attribute contexts. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Collapse whitespace and clip on a word boundary with a trailing ellipsis. */
export function clip(text, max) {
  if (!text) return '';
  const flat = String(text).replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(' ');
  const head = (space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,.;:!-]+$/, '');
  return head + '...';
}

/** Anonymous PostgREST read. Returns an array, or [] on any failure. */
export async function restSelect(path) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export function canonicalUrl(request) {
  const url = new URL(request.url);
  return SITE_ORIGIN + url.pathname;
}

/**
 * Build the minimal crawler document. No app bundle, no refresh redirect.
 */
export function metaDocument(opts) {
  const title = opts.title || GENERIC_TITLE;
  const description = opts.description || GENERIC_DESCRIPTION;
  const image = opts.image || GENERIC_IMAGE;
  const type = opts.type || 'website';
  const url = opts.url;

  const body = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:site_name" content="clbhouz" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${esc(type)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@clbhouz" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
  </head>
  <body>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    <p><a href="${esc(url)}">${esc(url)}</a></p>
  </body>
</html>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/** The existing generic tags, for a missing or non-public entity. */
export function genericDocument(request) {
  return metaDocument({
    title: GENERIC_TITLE,
    description: GENERIC_DESCRIPTION,
    image: GENERIC_IMAGE,
    type: 'website',
    url: canonicalUrl(request),
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value) => UUID_RE.test(String(value || ''));
