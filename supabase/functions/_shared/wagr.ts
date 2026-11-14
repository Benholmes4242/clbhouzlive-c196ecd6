/** WAGR alone owns source fields; one serialized request queue spaces all public
 * reads across profile/events/graph and callers. Never spoof browser headers.
 * Complete counting-window reads are required before destructive replacement. */
import { z } from 'npm:zod@3';

export function parseWagrInput(input: string): { slug: string; playerId: number } | null {
  let slug = input.trim();
  if (/^(https:\/\/|wagr\.com\/|www\.wagr\.com\/)/.test(slug)) {
    try {
      const url = new URL(slug.startsWith('https://') ? slug : `https://${slug}`);
      if (!['wagr.com', 'www.wagr.com'].includes(url.hostname) || url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      const match = url.pathname.match(/^\/playerprofile\/([^/]+)\/?$/);
      if (!match) return null;
      slug = match[1];
    } catch { return null; }
  }
  const match = slug.match(/^[a-z0-9-]+-(\d+)$/);
  if (!match) return null;
  const playerId = Number(match[1]);
  return Number.isSafeInteger(playerId) && playerId > 0 ? { slug, playerId } : null;
}

const number = z.union([z.number(), z.string().min(1)]).transform(Number).refine(Number.isFinite);
const nullableNumber = number.nullable().optional().transform(v => v ?? null);
const profileSchema = z.object({
  name: z.string(), position: nullableNumber, countryName: z.string().nullable(),
  pointsAverage: nullableNumber, playerId: number, divisor: nullableNumber,
  isPro: z.boolean(), gender: z.string().optional(),
  playerStatisticsInfo: z.object({ bestRanking: nullableNumber, wins: nullableNumber, top10Finishes: nullableNumber, countingEvents: nullableNumber }),
}).passthrough();
const eventSchema = z.object({ eventId: number, weekYear: z.string(), country: z.string().nullable(), eventName: z.string(), finishPosition: z.string().nullable(), points: nullableNumber, type: z.string().nullable(), format: z.string().nullable() });
const graphSchema = z.array(z.object({ week: number, rank: number, eventId: nullableNumber, eventName: z.string().nullable(), finishPosition: z.string().nullable(), points: nullableNumber }));
export type WagrProfile = z.infer<typeof profileSchema>;
export type WagrEvent = z.infer<typeof eventSchema>;
export type WagrGraph = z.infer<typeof graphSchema>;

export class WagrError extends Error {
  constructor(public status: number, public excerpt: string) { super(`WAGR (${status}): ${excerpt.slice(0, 300)}`); }
}
const base = 'https://worldgolfranking2021api.wagr.com/api/wagr/playerprofile';
export function createWagrClient(fetcher: typeof fetch = fetch, pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  let queue: Promise<unknown> = Promise.resolve();
  let requested = false;
  const read = (url: string, html = false): Promise<unknown> => {
    const task = queue.then(async () => {
      if (requested) await pause(1000);
      requested = true;
      const response = await fetcher(url, { headers: { 'User-Agent': 'clbhouz-rankings/1.0', Accept: html ? 'text/html' : 'application/json' }, signal: AbortSignal.timeout(15000) });
      const raw = await response.text();
      if (!response.ok) throw new WagrError(response.status, raw.slice(0, 300));
      const json = html ? raw.match(/<script\b(?=[^>]*\bid\s*=\s*["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script\s*>/i)?.[1] : raw;
      if (!json) throw new WagrError(response.status, raw.slice(0, 300));
      try { return JSON.parse(json); } catch { throw new WagrError(response.status, raw.slice(0, 300)); }
    });
    queue = task.catch(() => {});
    return task;
  };
  return {
    async fetchWagrProfile(slug: string): Promise<WagrProfile> {
      if (!parseWagrInput(slug) || parseWagrInput(slug)?.slug !== slug) throw new Error('Invalid WAGR slug');
      const next = await read(`https://www.wagr.com/playerprofile/${slug}`, true) as { props?: { pageProps?: { playerProfileComponent?: { playerProfileComponentModel?: { playerProfileData?: unknown } } } } };
      return profileSchema.parse(next.props?.pageProps?.playerProfileComponent?.playerProfileComponentModel?.playerProfileData);
    },
    async fetchWagrEvents(playerId: number): Promise<WagrEvent[]> {
      if (!Number.isSafeInteger(playerId) || playerId <= 0) throw new Error('Invalid WAGR player ID');
      const rows: WagrEvent[] = [];
      for (let page = 1; page <= 10; page++) {
        const data = z.object({ playerProfileEvents: z.array(eventSchema), playerEventsSettings: z.object({ totalNumberOfEvents: number }) }).parse(await read(`${base}/getPlayerEvents?profileId=${playerId}&tab=Counting&pageSize=20&pageNumber=${page}`));
        rows.push(...data.playerProfileEvents);
        if (rows.length >= data.playerEventsSettings.totalNumberOfEvents) return rows;
        if (!data.playerProfileEvents.length) throw new Error('Incomplete WAGR counting events');
      }
      throw new Error('WAGR counting events exceed 10-page cap');
    },
    async fetchWagrGraph(playerId: number): Promise<WagrGraph> {
      if (!Number.isSafeInteger(playerId) || playerId <= 0) throw new Error('Invalid WAGR player ID');
      const graph = graphSchema.parse(await read(`${base}/getPlayerRankingGraphData?playerId=${playerId}&minYear=0&maxYear=9999`));
      for (const row of graph) isoWeekThursday(Math.floor(row.week / 100), row.week % 100);
      return graph;
    },
  };
}
const client = createWagrClient();
export const { fetchWagrProfile, fetchWagrEvents, fetchWagrGraph } = client;

export function isoWeekThursday(yearOrWeek: number | string, weekArg?: number): Date {
  const match = typeof yearOrWeek === 'string' ? yearOrWeek.match(/^(\d{1,2})\/(\d{4})$/) : null;
  const year = match ? Number(match[2]) : Number(yearOrWeek);
  const week = match ? Number(match[1]) : weekArg;
  if (!Number.isInteger(year) || year < 1900 || !week || !Number.isInteger(week) || week > 53) throw new Error('Invalid ISO week');
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const thursday = new Date(Date.UTC(year, 0, 4 + 4 - (jan4.getUTCDay() || 7) + (week - 1) * 7));
  if (thursday.getUTCFullYear() !== year) throw new Error('Invalid ISO week');
  return thursday;
}