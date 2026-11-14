import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createWagrClient, isoWeekThursday, parseWagrInput, WagrError } from './wagr.ts';
const event = { eventId: 1, weekYear: '39/2026', country: 'England', eventName: ' Event ', finishPosition: '2', points: '8.4', type: 'All Ages', format: 'S/P' };
Deno.test('WAGR parser accepts full and schemeless URLs, query/hash and bare slug', () => {
  for (const input of ['lewy-hayward-41967', 'https://www.wagr.com/playerprofile/lewy-hayward-41967?x=1#ranking', 'wagr.com/playerprofile/lewy-hayward-41967', 'www.wagr.com/playerprofile/lewy-hayward-41967#x']) assertEquals(parseWagrInput(input), { slug: 'lewy-hayward-41967', playerId: 41967 });
});
Deno.test('WAGR parser rejects other hosts, credentials, paths and unsafe slugs', () => {
  for (const input of ['https://evil.com/playerprofile/a-1', 'https://wagr.com.evil.com/playerprofile/a-1', 'https://evil@wagr.com/playerprofile/a-1', 'http://wagr.com/playerprofile/a-1', '../a-1', 'A-1', 'a', 'a-0', 'a-1?x=1', 'https://wagr.com/other/a-1']) assertEquals(parseWagrInput(input), null);
});
Deno.test('WAGR ISO week 39/2026 is Thursday 2026-09-24 and graph week agrees', () => {
  assertEquals(isoWeekThursday('39/2026').toISOString().slice(0, 10), '2026-09-24');
  assertEquals(isoWeekThursday(2026, 39).toISOString().slice(0, 10), '2026-09-24');
});
Deno.test('WAGR event paging stops exactly at reported total with 1000ms spacing', async () => {
  const pauses: number[] = []; const urls: string[] = [];
  const client = createWagrClient(async (url, options) => {
    urls.push(String(url)); const headers = new Headers(options?.headers);
    assertEquals(headers.get('User-Agent'), 'clbhouz-rankings/1.0');
    assertEquals(headers.has('Origin'), false); assertEquals(headers.has('Referer'), false);
    assertEquals(headers.get('Accept'), 'application/json');
    return Response.json({ playerProfileEvents: [{ ...event, eventId: urls.length }], playerEventsSettings: { totalNumberOfEvents: 2 } });
  }, async ms => { pauses.push(ms); });
  assertEquals((await client.fetchWagrEvents(41967)).map(row => row.eventId), [1, 2]);
  assertEquals(urls.length, 2); assertEquals(urls[1].endsWith('pageNumber=2'), true); assertEquals(pauses, [1000]);
});
Deno.test('WAGR block-page error carries status and first 300 characters', async () => {
  const client = createWagrClient(() => Promise.resolve(new Response('x'.repeat(400), { status: 403 })), async () => {});
  const error = await assertRejects(() => client.fetchWagrGraph(1), WagrError);
  assertEquals((error as WagrError).status, 403); assertEquals((error as WagrError).excerpt, 'x'.repeat(300));
});
Deno.test('WAGR non-JSON success page is rejected rather than becoming empty graph', async () => {
  const client = createWagrClient(() => Promise.resolve(new Response('<html>Blocked</html>')), async () => {});
  await assertRejects(() => client.fetchWagrGraph(1), WagrError, '200');
});
Deno.test('WAGR hard cap refuses incomplete counting windows after ten pages', async () => {
  let calls = 0;
  const client = createWagrClient(() => { calls++; return Promise.resolve(Response.json({ playerProfileEvents: [event], playerEventsSettings: { totalNumberOfEvents: 11 } })); }, async () => {});
  await assertRejects(() => client.fetchWagrEvents(1), Error, '10-page cap'); assertEquals(calls, 10);
});
Deno.test('WAGR profile extracts the nested next data and spaces subsequent graph request', async () => {
  let calls = 0; const pauses: number[] = [];
  const profile = { name: 'Lewy Hayward', playerId: 41967, position: 123, countryName: 'England', isPro: false, playerStatisticsInfo: { bestRanking: 100, wins: 2, top10Finishes: 5, countingEvents: 20 } };
  const client = createWagrClient(() => Promise.resolve(++calls === 1 ? new Response(`<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { playerProfileComponent: { playerProfileComponentModel: { playerProfileData: profile } } } } })}</script>`) : Response.json([])), async ms => { pauses.push(ms); });
  assertEquals((await client.fetchWagrProfile('lewy-hayward-41967')).name, 'Lewy Hayward');
  await client.fetchWagrGraph(41967); assertEquals(pauses, [1000]);
});