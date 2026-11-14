import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handler, FUNCTION_VERSION } from './index.ts';
import { testClient, testEnvironment } from '../_shared/wagrTestClient.ts';
import type { WagrProfile } from '../_shared/wagr.ts';
const user = '11111111-1111-4111-8111-111111111111';
const req = (headers: Record<string, string>, body: unknown = { mode: 'ping' }) => new Request('https://example.com', { method: 'POST', headers, body: JSON.stringify(body) });
for (const scenario of [
  { name: 'internal secret', headers: { 'x-internal-secret': 'test-internal' }, admin: false, status: 200 },
  { name: 'service role', headers: { Authorization: 'Bearer test-service' }, admin: false, status: 200 },
  { name: 'signed-in admin', headers: { Authorization: 'Bearer member' }, admin: true, status: 200 },
  { name: 'signed-in non-admin', headers: { Authorization: 'Bearer member' }, admin: false, status: 403 },
  { name: 'invalid JWT', headers: { Authorization: 'Bearer invalid' }, admin: true, valid: false, status: 403 },
  { name: 'missing JWT', headers: {}, admin: false, status: 401 },
  { name: 'wrong internal secret with valid admin never falls through', headers: { 'x-internal-secret': 'wrong', Authorization: 'Bearer member' }, admin: true, status: 401 },
] ) Deno.test(`WAGR sync auth ${scenario.name}`, async () => {
  const restore = testEnvironment();
  try { const mock = testClient(() => ({ data: [], error: null }), scenario); const response = await handler(req(scenario.headers as Record<string, string>), mock.factory); assertEquals(response.status, scenario.status); if (response.status === 200) assertEquals(await response.json(), { FUNCTION_VERSION }); assertEquals(mock.calls.length, 0); } finally { restore(); }
});
Deno.test('WAGR internal target is refused and unset internal secret fails closed', async () => {
  const restore = testEnvironment();
  try { const mock = testClient(() => ({ data: [], error: null })); assertEquals((await handler(req({ 'x-internal-secret': 'test-internal' }, { user_id: user }), mock.factory)).status, 400); Deno.env.delete('INTERNAL_FN_SECRET'); assertEquals((await handler(req({ 'x-internal-secret': 'test-internal' }), mock.factory)).status, 500); } finally { restore(); }
});
const profile: WagrProfile = { name: 'Lewy', playerId: 41967, position: 100, countryName: 'England', pointsAverage: 5, divisor: 4, isPro: false, playerStatisticsInfo: { bestRanking: 90, wins: 2, top10Finishes: 3, countingEvents: 4 } };
Deno.test('WAGR sync maps summary/events/history, retains same-week different events and prunes counting window', async () => {
  const restore = testEnvironment();
  try {
    const mock = testClient(ops => ({ data: ops[0].table === 'amateur_rank_links' && ops[0].method === 'select' ? [{ user_id: user, wagr_slug: 'lewy-hayward-41967', wagr_player_id: 41967 }] : null, error: null }));
    const response = await handler(req({ Authorization: 'Bearer test-service' }, { user_id: user }), mock.factory, {
      fetchWagrProfile: () => Promise.resolve(profile),
      fetchWagrEvents: () => Promise.resolve([{ eventId: 10, weekYear: '39/2026', country: 'England', eventName: ' Event ', finishPosition: '2', points: 8, type: 'All Ages', format: 'S/P' }]),
      fetchWagrGraph: () => Promise.resolve([10, 11].map(eventId => ({ week: 202639, rank: 100, eventId, eventName: 'Event', finishPosition: '2', points: 8 }))),
    });
    assertEquals(response.status, 200); assertEquals((await response.json()).ok, 1);
    const summary = mock.calls.find(ops => ops[0].table === 'amateur_rank_summary')?.[0].args[0] as Record<string, unknown>;
    assertEquals(summary.rank_week, 202639); assertEquals(summary.top10s, 3);
    const events = mock.calls.find(ops => ops[0].table === 'amateur_events' && ops[0].method === 'upsert')?.[0].args[0] as Record<string, unknown>[];
    assertEquals(events[0].event_week, '2026-09-24'); assertEquals(events[0].event_name, 'Event');
    const history = mock.calls.find(ops => ops[0].table === 'amateur_rank_history' && ops[0].method === 'insert')?.[0].args[0] as Record<string, unknown>[];
    assertEquals(history.map(row => row.event_id), [10, 11]);
    const prune = mock.calls.find(ops => ops[0].table === 'amateur_events' && ops[0].method === 'delete');
    assertEquals(prune?.find(op => op.method === 'not')?.args, ['wagr_event_id', 'in', '(10)']);
  } finally { restore(); }
});
Deno.test('WAGR turned-pro sync preserves data and returns 500 when every member errors', async () => {
  const restore = testEnvironment();
  try {
    const mock = testClient(ops => ({ data: ops[0].method === 'select' ? [{ user_id: user, wagr_slug: 'lewy-hayward-41967', wagr_player_id: 41967 }] : null, error: null }));
    const response = await handler(req({ Authorization: 'Bearer test-service' }, {}), mock.factory, { fetchWagrProfile: () => Promise.resolve({ ...profile, isPro: true }), fetchWagrEvents: () => { throw new Error('must not fetch'); }, fetchWagrGraph: () => { throw new Error('must not fetch'); } });
    assertEquals(response.status, 500); assertEquals((await response.json()).results[0].error, 'turned_pro');
    assertEquals(mock.calls.length, 2); assertEquals(mock.calls[1][0].args[0], { last_error: 'turned_pro' });
  } finally { restore(); }
});
Deno.test('WAGR source failure continues to the next verified member', async () => {
  const restore = testEnvironment(); let count = 0;
  try {
    const mock = testClient(ops => ({ data: ops[0].method === 'select' ? [user, '22222222-2222-4222-8222-222222222222'].map(user_id => ({ user_id, wagr_slug: 'lewy-hayward-41967', wagr_player_id: 41967 })) : null, error: null }));
    const response = await handler(req({ Authorization: 'Bearer test-service' }, {}), mock.factory, { fetchWagrProfile: () => { if (++count === 1) throw new Error('blocked'); return Promise.resolve(profile); }, fetchWagrEvents: () => Promise.resolve([]), fetchWagrGraph: () => Promise.resolve([]) });
    assertEquals(response.status, 200); const result = await response.json(); assertEquals(result.processed, 2); assertEquals(result.ok, 1); assertEquals(result.errored, 1);
  } finally { restore(); }
});