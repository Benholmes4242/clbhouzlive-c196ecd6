/**
 * scrape-tour-rankings — Scrapes DP World Tour Race to Dubai rankings
 * and upserts into tour_season_rankings table.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RANKINGS_URLS: Record<
  string,
  { url: string; tourCode: string }
> = {
  euro: {
    url: "https://www.europeantour.com/dpworld-tour/rankings/overview/rankings/",
    tourCode: "euro",
  },
};

Deno.serve(async (req) => {
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
    const year: number = body.year || 2026;

    const config = RANKINGS_URLS[tour];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown tour: ${tour}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Fetch the rankings page
    console.log(`[scrape-tour-rankings] Fetching ${config.url}`);
    const response = await fetch(config.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch rankings: HTTP ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    console.log(`[scrape-tour-rankings] HTML length: ${html.length}`);

    // Step 2: Parse the HTML
    const players = parseEuropeanTourRankings(html);
    console.log(`[scrape-tour-rankings] Parsed ${players.length} players`);

    if (players.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No players parsed — HTML structure may have changed",
          htmlLength: html.length,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Match to sr_players by name
    const { data: existingPlayers } = await supabase
      .from("sr_players")
      .select("id, full_name, last_name, first_name")
      .or("tour_codes.cs.{euro},tour_codes.cs.{EURO}");

    const playerMap = buildPlayerNameMap(existingPlayers || []);
    console.log(`[scrape-tour-rankings] Player map size: ${playerMap.size}`);

    // Step 4: Upsert rankings
    const rows = players.map((p) => {
      const playerId = matchPlayer(p.name, playerMap);
      return {
        player_name: p.name,
        player_id: playerId,
        tour_code: config.tourCode,
        season_year: year,
        position: p.position,
        position_change: p.positionChange || null,
        points: p.points ? parseFloat(p.points.replace(/,/g, "")) : null,
        tournaments_played: p.tournamentsPlayed
          ? parseInt(p.tournamentsPlayed)
          : null,
        country: p.country || null,
        wins: 0,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    let upserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from("tour_season_rankings")
        .upsert(batch, { onConflict: "tour_code,season_year,player_name" });
      if (error) {
        console.error("[scrape-tour-rankings] Upsert error:", error);
        errors.push(error.message);
      } else {
        upserted += batch.length;
      }
    }

    // Log unmatched players
    const unmatched = rows.filter((r) => !r.player_id);
    if (unmatched.length > 0) {
      console.log(
        `[scrape-tour-rankings] Unmatched players (${unmatched.length}):`,
        unmatched.slice(0, 20).map((r) => r.player_name)
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tour,
        year,
        parsed: players.length,
        upserted,
        matched: rows.filter((r) => r.player_id).length,
        unmatched: unmatched.length,
        unmatchedNames: unmatched.slice(0, 20).map((r) => r.player_name),
        errors: errors.length > 0 ? errors : undefined,
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
 * Parse the European Tour rankings HTML page.
 * Each player row is a <tr class="rankings__row"> with cells for:
 *   position, position change, country flag, player name, sponsor, tournaments played, points
 */
function parseEuropeanTourRankings(
  html: string
): Array<{
  position: number;
  positionChange: string;
  name: string;
  country: string;
  tournamentsPlayed: string;
  points: string;
}> {
  const players: Array<{
    position: number;
    positionChange: string;
    name: string;
    country: string;
    tournamentsPlayed: string;
    points: string;
  }> = [];

  // Split by rankings__row to find each player row
  const rowSplits = html.split(/class="rankings__row"/);
  
  // Skip first split (before first row)
  for (let i = 1; i < rowSplits.length; i++) {
    const rowHtml = rowSplits[i];
    
    // Find the end of this row (next </tr>)
    const rowEnd = rowHtml.indexOf("</tr>");
    const row = rowEnd > 0 ? rowHtml.substring(0, rowEnd) : rowHtml;

    // Position: inside table__cell--pos
    const posMatch = row.match(
      /table__cell--pos[^>]*>[\s\S]*?<div[^>]*class="table__cell-inner"[^>]*>([\d]+)<\/div>/
    );
    if (!posMatch) continue;
    const position = parseInt(posMatch[1]);
    if (isNaN(position) || position <= 0) continue;

    // Position change: value-change class
    let positionChange = "-";
    const changeMatch = row.match(
      /value-change value-change--(up|down)"[^>]*>([\d]+)<\/div>/
    );
    if (changeMatch) {
      positionChange =
        changeMatch[1] === "up" ? `▲${changeMatch[2]}` : `▼${changeMatch[2]}`;
    }

    // Country from flag alt text
    const countryMatch = row.match(/alt="Flag for ([^"]+)"/);
    const country = countryMatch ? countryMatch[1] : "";

    // Player name: <strong>LASTNAME, </strong>Firstname
    const nameMatch = row.match(
      /leaderboard__name[^>]*><strong>([^<]+)<\/strong>([^<]*)<\/span>/
    );
    if (!nameMatch) continue;
    const lastName = nameMatch[1].trim();
    const firstName = nameMatch[2].trim();
    const name = `${lastName}${firstName}`;

    // Find all table__cell-inner divs to get tournaments played and points
    // These are the last numeric cells in the row
    // Strategy: find all <div class="table__cell-inner"> content values
    const cellInnerMatches = [
      ...row.matchAll(/<div class="table__cell-inner"[^>]*>([^<]*)<\/div>/g),
    ];
    
    // Typically: [position, changeVal, ..., tournamentsPlayed, points]
    // But points might be in table__cell--points
    let tournamentsPlayed = "";
    let points = "";

    // Try to find points specifically from the points cell
    const pointsMatch = row.match(
      /table__cell--points[\s\S]*?<div[^>]*class="table__cell-inner"[^>]*>([\d,\.]+)<\/div>/
    );
    if (pointsMatch) {
      points = pointsMatch[1].trim();
    }

    // Tournaments played — look for a cell-inner with a small number (1-50)
    // that appears after the country cell
    if (cellInnerMatches.length >= 3) {
      // The last few cell-inner values should be: [pos, change?, ..., tournamentsPlayed, points]
      const values = cellInnerMatches.map((m) => m[1].trim()).filter(Boolean);
      // Find tournaments played — it's typically the second-to-last numeric value
      for (let j = values.length - 1; j >= 0; j--) {
        const val = values[j];
        const num = parseInt(val);
        if (!isNaN(num) && num >= 1 && num <= 50 && val === String(num)) {
          tournamentsPlayed = val;
          break;
        }
      }
    }

    if (name && position > 0) {
      players.push({
        position,
        positionChange,
        name,
        country,
        tournamentsPlayed,
        points,
      });
    }
  }

  return players;
}

/**
 * Build a name lookup map from sr_players for matching.
 * Supports multiple formats: "LASTNAME, Firstname", "Firstname Lastname", etc.
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
  for (const p of players) {
    // Normalized formats
    if (p.last_name && p.first_name) {
      // "REED, Patrick" → key
      map.set(
        `${p.last_name.toUpperCase()}, ${p.first_name}`,
        p.id
      );
      // "REED, PATRICK" → key (all caps)
      map.set(
        `${p.last_name.toUpperCase()}, ${p.first_name.toUpperCase()}`,
        p.id
      );
      // Strip accents version
      const stripped = stripAccents(
        `${p.last_name.toUpperCase()}, ${p.first_name}`
      );
      map.set(stripped, p.id);
    }
    if (p.full_name) {
      map.set(p.full_name.toUpperCase(), p.id);
      map.set(stripAccents(p.full_name.toUpperCase()), p.id);
    }
  }
  return map;
}

/**
 * Attempt to match a scraped name to an sr_players record.
 * Scraped names come as "REED, Patrick" format.
 */
function matchPlayer(
  scrapedName: string,
  playerMap: Map<string, string>
): string | null {
  // Direct match
  let id = playerMap.get(scrapedName);
  if (id) return id;

  // Upper case match
  id = playerMap.get(scrapedName.toUpperCase());
  if (id) return id;

  // Strip accents match
  id = playerMap.get(stripAccents(scrapedName));
  if (id) return id;
  id = playerMap.get(stripAccents(scrapedName.toUpperCase()));
  if (id) return id;

  // Try "Firstname Lastname" from "LASTNAME, Firstname"
  const parts = scrapedName.match(/^([^,]+),\s*(.+)$/);
  if (parts) {
    const reversed = `${parts[2]} ${parts[1]}`;
    id = playerMap.get(reversed.toUpperCase());
    if (id) return id;
    id = playerMap.get(stripAccents(reversed.toUpperCase()));
    if (id) return id;
  }

  return null;
}

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
