import { corsFor } from '../_shared/cors.ts';
/**
 * scrape-tour-rankings - DP World Tour (Race to Dubai) season rankings ingest.
 *
 * Source: the tour's own JSON feed
 *   GET https://www.europeantour.com/api/sportdata/Rankings/Tour/{tourId}/Season/{year}
 * No auth. Cache-Control max-age ~89s, so the feed is materially fresher than
 * the old daily HTML scrape (which stopped working entirely once the rankings
 * table moved to client-side rendering).
 *
 * Writes ASCII only. The previous parser emitted arrow glyphs into
 * tour_season_rankings.position_change, which broke parseInt on the client.
 *
 * Sign convention, verified against the live payload (3 Aug 2026):
 * a POSITIVE RankMoved means the player MOVED UP (e.g. MAZZOLI, CurrentRank 39,
 * RankMoved 88 -> prior rank 127; the opposite reading gives an impossible -49).
 * RankMoved is stored VERBATIM. position_change is a shared column across
 * tours, so the feed's own convention is the stored one and the client does
 * the interpreting: priorRank = position + change, movement = change, both
 * positive-means-up.
 */


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Tour ids on the europeantour.com sportdata feed. 1 = DP World Tour. */
const TOUR_FEED: Record<string, { feedTourId: number; tourCode: string }> = {
  euro: { feedTourId: 1, tourCode: "euro" },
};

/**
 * Minimum mapped rows required before anything is written. The live Race to
 * Dubai list carries ~230 players; 50 is a floor a genuine early-season list
 * would still clear while catching any structural change to the payload.
 */
const MIN_MAPPED_ROWS = 50;

interface FeedRankingGroup {
  Group: number;
  CurrentRank: number | null;
  RankMoved?: number | null;
  CurrentPoints?: number | null;
  EventsPlayed?: number | null;
  EventWins?: number | null;
}

interface FeedPlayer {
  PlayerId?: number;
  FirstName?: string | null;
  LastName?: string | null;
  CountryCode?: string | null;
  RankingGroups?: FeedRankingGroup[];
}

interface FeedPayload {
  LastUpdated?: string;
  LastEventId?: number;
  LastEventName?: string;
  Groups?: Array<{ Group: number; Name?: string; MainGroup?: boolean }>;
  Players?: FeedPlayer[];
}

interface MappedRow {
  player_name: string;
  player_id: string | null;
  tour_code: string;
  season_year: number;
  position: number;
  position_change: string;
  points: number | null;
  tournaments_played: number | null;
  country: string | null;
  wins: number | null;
  scraped_at: string;
  updated_at: string;
}

function fail(message: string, corsHeaders: Record<string, string>, extra?: Record<string, unknown>) {
  console.error(`[scrape-tour-rankings] ABORT: ${message}`, extra ?? "");
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const tour: string = body.tour || "euro";
    const season: number = Number(body.year) || new Date().getUTCFullYear();
    // Test hook: lets the failed-fetch path be exercised without touching data.
    const urlOverride: string | undefined = body.url_override;

    const config = TOUR_FEED[tour];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown tour: ${tour}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url =
      urlOverride ??
      `https://www.europeantour.com/api/sportdata/Rankings/Tour/${config.feedTourId}/Season/${season}`;

    // ---- Guard 1: HTTP status -------------------------------------------
    console.log(`[scrape-tour-rankings] Fetching ${url}`);
    const response = await fetch(url, {
      headers: {
        // NOT a spoofed browser UA: Akamai returns 403 to a Chrome UA arriving
        // from a datacenter IP. A plain, honest agent string is served 200.
        "User-Agent": "clbhouz-rankings-sync/1.0 (+https://clbhouz.com)",
        Accept: "application/json",
      },
    });
    const raw = await response.text();
    console.log(`[scrape-tour-rankings] status=${response.status} bytes=${raw.length}`);
    if (!response.ok) {
      return fail(`Failed to fetch rankings feed: HTTP ${response.status}`, corsHeaders, {
        bytes: raw.length,
      });
    }

    // ---- Guard 2: valid JSON --------------------------------------------
    let payload: FeedPayload;
    try {
      payload = JSON.parse(raw) as FeedPayload;
    } catch {
      return fail("Rankings feed did not return valid JSON", corsHeaders, { bytes: raw.length });
    }

    // ---- Guard 3: main group present ------------------------------------
    const mainGroup = payload.Groups?.find((g) => g.MainGroup === true)?.Group;
    if (mainGroup == null) {
      return fail("No group in the payload carries MainGroup: true", corsHeaders, {
        groups: (payload.Groups ?? []).map((g) => g.Group),
      });
    }

    const feedPlayers = payload.Players ?? [];
    console.log(
      `[scrape-tour-rankings] mainGroup=${mainGroup} playersInPayload=${feedPlayers.length} lastEvent=${payload.LastEventName ?? "n/a"}`
    );

    // ---- Pass 1: match within euro-tagged sr_players --------------------
    const { data: existingPlayers } = await supabase
      .from("sr_players")
      .select("id, full_name, last_name, first_name")
      .or("tour_codes.cs.{euro},tour_codes.cs.{EURO}");
    const playerMap = buildPlayerNameMap(existingPlayers || []);

    // ---- Map ------------------------------------------------------------
    const now = new Date().toISOString();
    const rows: MappedRow[] = [];
    // Feed first/last kept per row so pass 2 can match on discrete fields.
    const feedNames: Array<{ first: string; last: string }> = [];
    let skippedNoMainGroup = 0;
    let skippedNullRank = 0;

    for (const p of feedPlayers) {
      const entry = (p.RankingGroups ?? []).find((g) => g.Group === mainGroup);
      // Swing-only players carry no main-group entry: not on the Race to Dubai.
      if (!entry) {
        skippedNoMainGroup++;
        continue;
      }
      if (entry.CurrentRank == null) {
        skippedNullRank++;
        continue;
      }
      const first = (p.FirstName ?? "").trim();
      const last = (p.LastName ?? "").trim();
      const name = `${first} ${last}`.replace(/\s+/g, " ").trim();
      const moved = Number.isFinite(Number(entry.RankMoved)) ? Number(entry.RankMoved) : 0;
      feedNames.push({ first, last });
      rows.push({
        player_name: name,
        player_id: name ? matchPlayer(name, playerMap) : null,
        tour_code: config.tourCode,
        season_year: season,
        position: Math.trunc(entry.CurrentRank),
        // Verbatim: see the sign note in the file header.
        position_change: String(moved),
        points: entry.CurrentPoints == null ? null : Number(entry.CurrentPoints),
        tournaments_played: entry.EventsPlayed == null ? null : Math.trunc(entry.EventsPlayed),
        country: p.CountryCode ?? null,
        wins: entry.EventWins == null ? null : Math.trunc(entry.EventWins),
        scraped_at: now,
        updated_at: now,
      });
    }

    const matchedPass1 = rows.filter((r) => r.player_id).length;

    // ---- Pass 2: unmatched only, exact first AND last across ALL players -
    // Non-members (Rahm, Justin Thomas, Aberg, Min Woo Lee, Adam Scott) score
    // Race to Dubai points in co-sanctioned events and majors but are tagged
    // pga/LIV, so pass 1 excludes them from the pool by construction.
    // A name that matches more than one row is never accepted.
    let matchedPass2 = 0;
    const ambiguous: Array<{ name: string; candidates: number }> = [];
    const needsPass2 = rows.some((r) => !r.player_id);
    if (needsPass2) {
      const allPlayers: Array<{ id: string; first_name: string | null; last_name: string | null }> = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: page, error: allErr } = await supabase
          .from("sr_players")
          .select("id, first_name, last_name")
          .range(from, from + PAGE - 1);
        if (allErr) {
          console.error(`[scrape-tour-rankings] pass 2 pool fetch failed: ${allErr.message}`);
          break;
        }
        allPlayers.push(...((page ?? []) as typeof allPlayers));
        if (!page || page.length < PAGE) break;
      }

      const pairIndex = new Map<string, string[]>();
      for (const p of allPlayers) {
        if (!p.first_name || !p.last_name) continue;
        const key = `${normalizeName(p.first_name)}|${normalizeName(p.last_name)}`;
        const list = pairIndex.get(key);
        if (list) list.push(p.id);
        else pairIndex.set(key, [p.id]);
      }

      rows.forEach((r, i) => {
        if (r.player_id) return;
        const { first, last } = feedNames[i];
        if (!first || !last) return;
        const hits = pairIndex.get(`${normalizeName(first)}|${normalizeName(last)}`);
        if (!hits || hits.length === 0) return;
        if (hits.length > 1) {
          ambiguous.push({ name: r.player_name, candidates: hits.length });
          console.warn(
            `[scrape-tour-rankings] pass 2 ambiguous: "${r.player_name}" matched ${hits.length} sr_players rows - left null`
          );
          return;
        }
        r.player_id = hits[0];
        matchedPass2++;
      });

      console.log(
        `[scrape-tour-rankings] pass2 pool=${allPlayers.length} matched=${matchedPass2} ambiguous=${ambiguous.length}`
      );
    }


    console.log(
      `[scrape-tour-rankings] mapped=${rows.length} skippedSwingOnly=${skippedNoMainGroup} skippedNullRank=${skippedNullRank}`
    );

    // ---- Guard 4: floor on mapped rows ----------------------------------
    if (rows.length < MIN_MAPPED_ROWS) {
      return fail(
        `Only ${rows.length} rows mapped, below the floor of ${MIN_MAPPED_ROWS} - refusing to write`,
        corsHeaders,
        { playersInPayload: feedPlayers.length, mainGroup }
      );
    }

    // ---- Guard 5: every row complete ------------------------------------
    const incomplete = rows.filter(
      (r) => !r.player_name || !Number.isFinite(r.position) || r.position <= 0
    );
    if (incomplete.length > 0) {
      return fail(
        `${incomplete.length} mapped rows are missing a position or a player name - refusing to write a partial list`,
        corsHeaders,
        { mapped: rows.length }
      );
    }

    // ---- Replace: delete only after a validated fetch --------------------
    const { count: priorCount } = await supabase
      .from("tour_season_rankings")
      .select("id", { count: "exact", head: true })
      .eq("tour_code", config.tourCode)
      .eq("season_year", season);

    const { error: delErr } = await supabase
      .from("tour_season_rankings")
      .delete()
      .eq("tour_code", config.tourCode)
      .eq("season_year", season);
    if (delErr) {
      return fail(`Failed to clear existing rows: ${delErr.message}`, corsHeaders);
    }

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from("tour_season_rankings").insert(batch);
      if (error) {
        return fail(`Insert failed at offset ${i}: ${error.message}`, corsHeaders, { inserted });
      }
      inserted += batch.length;
    }

    const matched = rows.filter((r) => r.player_id).length;
    console.log(
      `[scrape-tour-rankings] deleted=${priorCount ?? 0} inserted=${inserted} matched=${matched} unmatched=${rows.length - matched}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        tour,
        season,
        lastUpdated: payload.LastUpdated ?? null,
        lastEventName: payload.LastEventName ?? null,
        bytes: raw.length,
        mainGroup,
        playersInPayload: feedPlayers.length,
        mapped: rows.length,
        skippedSwingOnly: skippedNoMainGroup,
        skippedNullRank,
        deleted: priorCount ?? 0,
        inserted,
        matched,
        matchedPass1,
        matchedPass2,
        ambiguous,

        unmatched: rows.length - matched,
        unmatchedNames: rows.filter((r) => !r.player_id).slice(0, 20).map((r) => r.player_name),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[scrape-tour-rankings] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Build a name lookup map from sr_players for matching.
 * Keys cover "Firstname Lastname", "LASTNAME, Firstname" and accent-stripped
 * variants; the feed now supplies discrete first/last names so the
 * "Firstname Lastname" key is the one that carries the traffic.
 */
function buildPlayerNameMap(
  players: Array<{
    id: string;
    full_name: string | null;
    last_name: string | null;
    first_name: string | null;
  }>
): Map<string, string> {
  const map = new Map<string, string>();
  const put = (key: string, id: string) => {
    const k = normalizeName(key);
    if (k && !map.has(k)) map.set(k, id);
  };
  for (const p of players) {
    if (p.first_name && p.last_name) {
      put(`${p.first_name} ${p.last_name}`, p.id);
      put(`${p.last_name}, ${p.first_name}`, p.id);
    }
    if (p.full_name) {
      put(p.full_name, p.id);
      const parts = p.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        put(`${parts.slice(1).join(" ")}, ${parts[0]}`, p.id);
      }
    }
  }
  return map;
}

/** Case-, accent- and punctuation-insensitive key. */
function normalizeName(name: string): string {
  return stripAccents(name)
    .toUpperCase()
    .replace(/[^A-Z, ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Characters that survive NFD (single codepoints with no canonical
 * decomposition) and would otherwise be deleted by the non-ASCII filter
 * rather than transliterated. Pre-pass MUST run before normalize("NFD").
 */
const STROKE_MAP: Record<string, string> = {
  "Ø": "O", "ø": "o",   // Danish/Norwegian — Højgaard, Nørgaard, Olesen
  "Æ": "AE", "æ": "ae", // Danish/Norwegian
  "Ł": "L", "ł": "l",   // Polish
  "Đ": "D", "đ": "d",   // Croatian
  "Ð": "D", "ð": "d",   // Icelandic
  "Þ": "TH", "þ": "th", // Icelandic
  "ß": "ss",            // German
};

function stripAccents(s: string): string {
  return s
    .replace(/[ØøÆæŁłĐđÐðÞþß]/g, (c) => STROKE_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/** Match a feed name ("Patrick REED") to an sr_players id, or null. */
function matchPlayer(name: string, map: Map<string, string>): string | null {
  const direct = map.get(normalizeName(name));
  if (direct) return direct;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const swapped = `${parts.slice(1).join(" ")}, ${parts[0]}`;
    const hit = map.get(normalizeName(swapped));
    if (hit) return hit;
  }
  return null;
}
