/** Brief 35: course-image-proxy. Serves ONLY golf_courses.thumbnail_image for the given course id,
 * so share-card exports can read photos whose hosts block CORS. No arbitrary URL parameter exists. */
export const MAX_BYTES = 8 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PROXY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};
export interface ProxyDeps {
  lookupThumbnail: (courseId: string) => Promise<string | null>;
  fetchImpl: typeof fetch;
}
const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...PROXY_HEADERS, 'Content-Type': 'application/json' } });

export async function handleProxy(req: Request, deps: ProxyDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: PROXY_HEADERS });
  if (req.method !== 'GET') return fail(405, 'method not allowed');
  const courseId = new URL(req.url).searchParams.get('course_id') ?? '';
  if (!UUID.test(courseId)) return fail(400, 'course_id must be a uuid');
  let src: string | null;
  try { src = await deps.lookupThumbnail(courseId); } catch { return fail(502, 'lookup failed'); }
  if (!src) return fail(404, 'no thumbnail_image');
  let target: URL;
  try { target = new URL(src); } catch { return fail(404, 'no thumbnail_image'); }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return fail(404, 'no thumbnail_image');
  let upstream: Response;
  try { upstream = await deps.fetchImpl(target.toString(), { redirect: 'follow' }); } catch { return fail(502, 'upstream fetch failed'); }
  if (!upstream.ok) return fail(502, `upstream ${upstream.status}`);
  const type = (upstream.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) return fail(415, 'not an image');
  const declared = Number(upstream.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) return fail(413, 'image too large');
  const reader = upstream.body?.getReader();
  if (!reader) return fail(502, 'empty body');
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) { await reader.cancel(); return fail(413, 'image too large'); }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { body.set(c, offset); offset += c.byteLength; }
  return new Response(body, { status: 200, headers: { ...PROXY_HEADERS, 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' } });
}
