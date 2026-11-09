import { corsFor } from '../_shared/cors.ts';
/**
 * scrape-season-rankings - LPGA, Korn Ferry, LIV and Champions season standings.
 *
 * Restores the three non-euro parts of the GitHub scraper deleted in 212cb6bbd3
 * (scripts/scrape-r2d-rankings.cjs) and adds Champions. Race to Dubai is NOT
 * here: scrape-tour-rankings owns euro.
 *
 * Every source is JSON, no headless browser:
 *   lpga  GET https://www.lpga.com/-/statistics/statstable?year=Y&tableId=<Race to CME Globe>
 *         (the XHR the rankings page itself makes)
 *   pgad  https://www.pgatour.com/korn-ferry-tour/pointslist        -> __NEXT_DATA__ tourCupMetaList
 *   champ https://www.pgatour.com/pgatour-champions/schwabcup       -> __NEXT_DATA__ "Points" list
 *   liv   https://www.livgolf.com/standings                         -> RSC payload initialPlayerStandings
 *
 * Write contract (unchanged from the old script): upsert on
 * (tour_code, season_year, player_name); movement computed from our own previous
 * run BEFORE the upsert (positive = moved up); stale rows swept only after a
 * successful write; player_id bound afterwards by exact name match against
 * sr_players tagged with the tour; scraped_at on every row.
 *
 * Season year is the one the source publishes (falls back to the UTC year).
 * The old script's "November and later = next year" rule is deliberately
 * dropped: these four seasons are calendar years and that rule would have
 * written the finished 2026 lists under 2027.
 *
 * A tour whose mapped rows fall below its floor writes nothing.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type TourCode = "lpga" | "pgad" | "liv" | "champ";

interface Parsed {
  name: string;
  first?: string;
  last?: string;
  position: number;
  points: number | null;
  events: number | null;
  wins: number | null;
  country: string | null;
}
interface Source {
  season: number;
  players: Parsed[];
  sourceUrl: string;
  through?: string | null;
}

const MIN_ROWS: Record<TourCode, number> = { lpga: 100, pgad: 100, champ: 50, liv: 40 };
/** sr_players.tour_codes tags searched in pass 1. */
const TAGS: Record<TourCode, string[]> = {
  lpga: ["LPGA", "lpga"],
  pgad: ["PGAD", "pgad"],
  liv: ["LIV", "liv"],
  champ: ["CHAMP", "champ", "SEN", "sen", "PGAS", "pgas"],
};
/** LIV and Champions players are mostly tagged with another tour: allow a unique exact first+last pass. */
const PASS2: Record<TourCode, boolean> = { lpga: false, pgad: false, liv: true, champ: true };

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function get(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/json" } });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return t;
}
const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const int = (v: unknown): number | null => {
  const n = num(v);
  return n == null ? null : Math.trunc(n);
};
const yearFrom = (s: unknown, fallback: number) => {
  const m = String(s ?? "").match(/(20\d\d)/);
  return m ? Number(m[1]) : fallback;
};

function nextData(html: string): any {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("No __NEXT_DATA__ on page");
  return JSON.parse(m[1]);
}

function tourCupPlayers(list: any): Parsed[] {
  const out: Parsed[] = [];
  for (const p of list?.officialPlayers ?? []) {
    if (!p?.displayName) continue; // separator rows ("Top 20 earn cards")
    const position = int(p.rankingData?.official);
    if (!position || position <= 0) continue;
    out.push({
      name: String(p.displayName).trim(),
      first: p.firstName ?? undefined,
      last: p.lastName ?? undefined,
      position,
      points: num(p.pointData?.official),
      events: int(p.columnData?.[0]),
      wins: null,
      country: p.country ?? null,
    });
  }
  return out;
}

async function fetchKornFerry(year: number): Promise<Source> {
  const url = "https://www.pgatour.com/korn-ferry-tour/pointslist";
  const d = nextData(await get(url));
  const list = d?.props?.pageProps?.tourCupMetaList?.[0];
  return { season: yearFrom(list?.season ?? list?.id, year), players: tourCupPlayers(list), sourceUrl: url, through: list?.description ?? null };
}

async function fetchChampions(year: number): Promise<Source> {
  const url = "https://www.pgatour.com/pgatour-champions/schwabcup";
  const d = nextData(await get(url));
  const lists: any[] = d?.props?.pageProps?.tourCupMetaList ?? [];
  const list = lists.find((l) => /points/i.test(l?.title ?? ""));
  if (!list) throw new Error("No Charles Schwab Cup Points list on page");
  const headers: string[] = (list.columnHeaders ?? []).map((h: any) => String(h?.text ?? h));
  const winsIdx = headers.findIndex((h) => /^wins$/i.test(h));
  const players = tourCupPlayers(list);
  // wins column: re-read from the raw rows so index alignment is exact
  const raw = (list.officialPlayers ?? []).filter((p: any) => p?.displayName && int(p.rankingData?.official));
  players.forEach((p, i) => { if (winsIdx >= 0) p.wins = int(raw[i]?.columnData?.[winsIdx]); });
  return { season: yearFrom(list.season ?? list.id, year), players, sourceUrl: url, through: list.description ?? null };
}

async function fetchLpga(year: number): Promise<Source> {
  const url = `https://www.lpga.com/-/statistics/statstable?year=${year}&tableId=162ac4c4-eccb-4237-ab37-4df94aa99e13&tournamentId=`;
  const j = JSON.parse(await get(url));
  const rows: any[] = j?.result?.rows ?? [];
  const players: Parsed[] = [];
  for (const r of rows) {
    const f = new Map<string, any>((r.fields ?? []).map((x: any) => [x.fieldName, x]));
    const pl = f.get("PlayerId")?.player;
    const position = int(f.get("cme_points_rank")?.value);
    if (!pl || !position) continue;
    const first = String(pl.firstName ?? "").trim();
    const last = String(pl.lastName ?? "").trim();
    players.push({
      name: `${first} ${last}`.replace(/\s+/g, " ").trim(),
      first, last, position,
      points: num(f.get("cme_points")?.value),
      events: int(f.get("points_events_played")?.value),
      wins: int(f.get("official_wins")?.value),
      country: pl.countryAbbr ?? null,
    });
  }
  return { season: year, players, sourceUrl: url };
}

async function fetchLiv(year: number): Promise<Source> {
  const url = "https://www.livgolf.com/standings";
  const html = await get(url);
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)].map((m) => JSON.parse(`"${m[1]}"`));
  const t = chunks.join("");
  const key = '"initialPlayerStandings":';
  const i = t.indexOf(key);
  if (i < 0) throw new Error("No initialPlayerStandings in LIV payload");
  // Bracket-match the array.
  let depth = 0, j = i + key.length, start = j;
  for (; j < t.length; j++) {
    const c = t[j];
    if (c === '"') { j++; while (j < t.length && t[j] !== '"') { if (t[j] === "\\") j++; j++; } continue; }
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") { depth--; if (depth === 0) { j++; break; } }
  }
  const arr: any[] = JSON.parse(t.slice(start, j));
  const sm = t.slice(Math.max(0, i - 400), i).match(/"seasons":\[(\d{4})/);
  const players: Parsed[] = arr
    .map((a) => ({
      name: String(a.playerName ?? "").replace(/\s*\((?:C|WC|R)\)\s*$/i, "").trim(),
      position: int(a.rank) ?? 0,
      points: num(a.points),
      events: null, wins: null, country: null,
    }))
    .filter((p) => p.name && p.position > 0);
  return { season: sm ? Number(sm[1]) : year, players, sourceUrl: url };
}

const FETCH: Record<TourCode, (y: number) => Promise<Source>> = {
  lpga: fetchLpga, pgad: fetchKornFerry, liv: fetchLiv, champ: fetchChampions,
};

// ---- name folding (same rules as the old script / scrape-tour-rankings) ----
const STROKE: Array<[RegExp, string]> = [
  [/[\u00d8\u00f8]/g, "O"], [/[\u00c6\u00e6]/g, "AE"], [/[\u0141\u0142]/g, "L"],
  [/[\u0110\u0111\u00d0\u00f0]/g, "D"], [/[\u00de\u00fe]/g, "TH"], [/\u00df/g, "ss"],
];
function fold(v: string | null | undefined): string {
  if (!v) return "";
  let s = String(v);
  for (const [re, sub] of STROKE) s = s.replace(re, sub);
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z\s'-]/g, "")
    .replace(/\s+/g, " ").trim().toUpperCase();
}

async function runTour(supabase: SupabaseClient, tour: TourCode, year: number) {
  const runStart = new Date().toISOString();
  const src = await FETCH[tour](year);
  // De-duplicate on the upsert key.
  const seen = new Set<string>();
  const players = src.players.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
  if (players.length < MIN_ROWS[tour]) {
    return { tour, ok: false, error: `Only ${players.length} rows mapped, below the floor of ${MIN_ROWS[tour]} - nothing written`, sourceUrl: src.sourceUrl };
  }
  const season = src.season;
  const now = new Date().toISOString();
  const rows = players.map((p) => ({
    player_name: p.name,
    tour_code: tour,
    season_year: season,
    position: p.position,
    position_change: null as string | null,
    points: p.points,
    tournaments_played: tour === "lpga" || tour === "champ" ? p.events : null,
    country: tour === "lpga" ? p.country : null,
    wins: tour === "lpga" || tour === "champ" ? (p.wins ?? 0) : 0,
    scraped_at: now,
    updated_at: now,
  }));

  // Movement from our own previous run - BEFORE the upsert.
  const { data: prevRows } = await supabase.from("tour_season_rankings")
    .select("player_name, position").eq("tour_code", tour).eq("season_year", season);
  const prev = new Map<string, number>();
  for (const r of prevRows ?? []) if (typeof r.position === "number") prev.set(r.player_name, r.position);
  for (const r of rows) {
    const p = prev.get(r.player_name);
    r.position_change = typeof p === "number" ? String(p - r.position) : null;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from("tour_season_rankings")
      .upsert(batch, { onConflict: "tour_code,season_year,player_name" });
    if (error) return { tour, ok: false, season, error: `Upsert failed at ${i}: ${error.message}`, upserted };
    upserted += batch.length;
  }

  const { count: swept } = await supabase.from("tour_season_rankings")
    .delete({ count: "exact" }).eq("tour_code", tour).eq("season_year", season).lt("scraped_at", runStart);

  // Player matching.
  const orTags = TAGS[tour].map((t) => `tour_codes.cs.{${t}}`).join(",");
  const { data: pool } = await supabase.from("sr_players").select("id, full_name, first_name, last_name").or(orTags);
  const binds: Array<{ name: string; id: string }> = [];
  const unmatched: Parsed[] = [];
  for (const p of players) {
    const f = fold(p.name);
    const hit = (pool ?? []).find((s: any) => fold(s.full_name) === f)
      ?? (pool ?? []).find((s: any) => fold(`${s.first_name ?? ""} ${s.last_name ?? ""}`) === f);
    if (hit) binds.push({ name: p.name, id: hit.id }); else unmatched.push(p);
  }
  let pass2 = 0;
  if (PASS2[tour] && unmatched.length) {
    const all: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("sr_players").select("id, first_name, last_name").range(from, from + 999);
      all.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const idx = new Map<string, string[]>();
    for (const s of all) {
      if (!s.first_name || !s.last_name) continue;
      const k = `${fold(s.first_name)}|${fold(s.last_name)}`;
      idx.set(k, [...(idx.get(k) ?? []), s.id]);
    }
    for (const p of [...unmatched]) {
      const parts = p.name.split(/\s+/);
      const first = p.first ?? parts[0];
      const last = p.last ?? parts.slice(1).join(" ");
      const hits = idx.get(`${fold(first)}|${fold(last)}`);
      if (hits && hits.length === 1) {
        binds.push({ name: p.name, id: hits[0] });
        unmatched.splice(unmatched.indexOf(p), 1);
        pass2++;
      }
    }
  }
  for (let i = 0; i < binds.length; i += 20) {
    await Promise.all(binds.slice(i, i + 20).map((b) =>
      supabase.from("tour_season_rankings").update({ player_id: b.id })
        .eq("tour_code", tour).eq("season_year", season).eq("player_name", b.name)));
  }

  const top3 = [...rows].sort((a, b) => a.position - b.position).slice(0, 3)
    .map((r) => ({ position: r.position, name: r.player_name, points: r.points }));
  return {
    tour, ok: true, season, sourceUrl: src.sourceUrl, through: src.through ?? null,
    rows: rows.length, upserted, swept: swept ?? 0, matched: binds.length, matchedPass2: pass2,
    unmatchedNames: unmatched.slice(0, 15).map((p) => p.name), top3, scraped_at: now,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const all: TourCode[] = ["lpga", "pgad", "liv", "champ"];
    const requested = body?.tour == null || body.tour === "all" ? all : [body.tour];
    if (!requested.every((t: unknown) => all.includes(t as TourCode))) {
      return new Response(JSON.stringify({ error: `Unknown tour: ${body.tour}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const year = Number.isInteger(body?.year) && body.year > 2000 && body.year < 2100 ? body.year : new Date().getUTCFullYear();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results = [];
    for (const t of requested as TourCode[]) {
      try { results.push(await runTour(supabase, t, year)); }
      catch (e) { results.push({ tour: t, ok: false, error: (e as Error).message }); }
      console.log(`[scrape-season-rankings] ${JSON.stringify(results[results.length - 1]).slice(0, 600)}`);
    }
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
