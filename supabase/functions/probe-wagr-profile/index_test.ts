import { bodySchema, probeProfile } from './index.ts';

function assert(condition: boolean, message: string) { if (!condition) throw new Error(message); }

Deno.test('WAGR slug accepts lewy-hayward-41967 and rejects unsafe paths', () => {
  assert(bodySchema.safeParse({ slug: 'lewy-hayward-41967' }).success, 'Valid slug rejected');
  for (const slug of ['../41967', 'lewy-hayward', 'Lewy-41967', 'lewy-41967?x=1']) {
    assert(!bodySchema.safeParse({ slug }).success, `Unsafe slug accepted: ${slug}`);
  }
});

Deno.test('WAGR requests preserve order, 1000ms spacing, honest headers and full JSON', async () => {
  const calls: string[] = [];
  const pauses: number[] = [];
  const profile = { name: 'Lewy', position: 123, countryName: 'England', pointsAverage: 42, extra: { retained: true } };
  const fetcher: typeof fetch = async (input, options) => {
    const url = String(input);
    calls.push(url);
    const headers = new Headers(options?.headers);
    assert(headers.get('User-Agent') === 'clbhouz-rankings/1.0', 'Wrong user agent');
    assert(!headers.has('Origin') && !headers.has('Referer'), 'Spoofed browser headers');
    assert(options?.signal instanceof AbortSignal, 'Missing timeout signal');
    if (calls.length === 1) {
      assert(headers.get('Accept') === 'text/html', 'Wrong HTML Accept');
      return new Response(`<script type="application/json" id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { other: true, playerProfileComponent: { playerProfileComponentModel: { playerProfileData: profile } } } } })}</script>`);
    }
    assert(headers.get('Accept') === 'application/json', 'Wrong API Accept');
    return new Response(JSON.stringify({ page: calls.length, complete: [1, 2, 3] }), { headers: { 'content-type': 'application/json', server: 'probe-test' } });
  };
  const result = await probeProfile('lewy-hayward-41967', fetcher, async ms => { pauses.push(ms); });
  assert(calls.length === 4 && pauses.length === 3 && pauses.every(ms => ms === 1000), 'Wrong request count or spacing');
  assert(calls[1].endsWith('pageNumber=1') && calls[2].endsWith('pageNumber=2') && calls[3].endsWith('playerId=41967&minYear=0&maxYear=9999'), 'Wrong request order');
  assert(JSON.stringify(result.requests[0].player_profile_data) === JSON.stringify(profile), 'Profile truncated');
  assert(result.requests[0].page_props_keys?.includes('other') === true, 'Missing pageProps key');
  assert(JSON.stringify(result.requests[3].json) === JSON.stringify({ page: 4, complete: [1, 2, 3] }), 'API JSON truncated');
});

Deno.test('WAGR block pages and network failures never stop later requests', async () => {
  let count = 0;
  const fetcher: typeof fetch = async () => {
    count++;
    if (count === 2) throw new Error('Simulated timeout');
    return new Response('X'.repeat(2500), { status: 403, headers: { server: 'Akamai' } });
  };
  const result = await probeProfile('lewy-hayward-41967', fetcher, async () => {});
  assert(count === 4 && result.requests.length === 4, 'Stopped after failure');
  assert(result.requests[0].raw_body?.length === 2000 && result.requests[0].status === 403, 'Block-page evidence missing');
  assert(result.requests[1].error === 'Simulated timeout' && result.requests[1].status === null, 'Network error evidence missing');
  assert(result.requests[3].headers.server === 'Akamai', 'Response headers missing');
});