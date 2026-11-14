import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handler } from './index.ts';
import { testClient, testEnvironment } from '../_shared/wagrTestClient.ts';
import type { WagrProfile } from '../_shared/wagr.ts';
const profile = { name: 'Lewy Hayward', playerId: 41967, countryName: 'England', position: 100, isPro: false, playerStatisticsInfo: { bestRanking: 90, wins: 1, top10Finishes: 2, countingEvents: 3 }, divisor: 3, pointsAverage: 2 } satisfies WagrProfile;
const request = (action = 'request', token = 'member', input = 'lewy-hayward-41967') => new Request('https://example.com', { method: 'POST', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}), body: JSON.stringify({ action, input }) });
for (const [name, valid, anonymous, token] of [['missing JWT', true, false, ''], ['invalid JWT', false, false, 'invalid'], ['anonymous JWT', true, true, 'anonymous']] as const) Deno.test(`WAGR link refuses ${name} before fetching`, async () => {
  const restore = testEnvironment(); let fetched = false;
  try { const mock = testClient(() => ({ data: null, error: null }), { valid, anonymous }); const response = await handler(request('lookup', token), mock.factory, () => { fetched = true; return Promise.resolve(profile); }); assertEquals(response.status, 401); assertEquals(fetched, false); } finally { restore(); }
});
Deno.test('WAGR lookup validates link and stores nothing', async () => {
  const restore = testEnvironment();
  try { const mock = testClient(() => ({ data: null, error: null })); assertEquals((await handler(request('lookup', 'member', 'bad'), mock.factory)).status, 400); const response = await handler(request('lookup'), mock.factory, () => Promise.resolve(profile)); assertEquals(await response.json(), { playerId: 41967, slug: 'lewy-hayward-41967', name: 'Lewy Hayward', country: 'England', rank: 100, isPro: false }); assertEquals(mock.calls.length, 0); } finally { restore(); }
});
for (const code of ['wagr_profile_is_pro', 'caller_is_pro', 'already_linked', 'claimed_by_another']) Deno.test(`WAGR request returns 409 ${code}`, async () => {
  const restore = testEnvironment();
  try {
    const mock = testClient(ops => {
      if (ops[0].table === 'user_profiles') return { data: { pro_verified_at: code === 'caller_is_pro' ? '2026-11-01' : null }, error: null };
      if (ops.some(op => op.method === 'insert')) return { data: null, error: { code: '23505', message: 'amateur_rank_links_player_live', details: '' } };
      return { data: code === 'already_linked' ? { status: 'pending' } : null, error: null };
    });
    const response = await handler(request(), mock.factory, () => Promise.resolve({ ...profile, isPro: code === 'wagr_profile_is_pro' }));
    assertEquals(response.status, 409); assertEquals((await response.json()).code, code);
  } finally { restore(); }
});
Deno.test('WAGR rejected claim is deleted before fresh pending insert', async () => {
  const restore = testEnvironment(); let fetched = 0;
  try {
    const mock = testClient(ops => ({ data: ops[0].table === 'user_profiles' ? { pro_verified_at: null } : ops.some(op => op.method === 'insert') ? { status: 'pending' } : { status: 'rejected' }, error: null }));
    const response = await handler(request(), mock.factory, () => { fetched++; return Promise.resolve(profile); });
    assertEquals(response.status, 200); assertEquals(fetched, 1);
    assertEquals(mock.calls.slice(-2).map(ops => ops[0].method), ['delete', 'insert']);
    const payload = mock.calls.at(-1)?.[0].args[0] as Record<string, unknown>;
    assertEquals(payload.wagr_name, 'Lewy Hayward'); assertEquals(payload.status, 'pending');
  } finally { restore(); }
});