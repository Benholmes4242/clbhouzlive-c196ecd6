// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhsCourse {
  id: string;
  name: string;
  country_code: string | null;
  country_name: string | null;
  is_linked_to_multi_course_club: boolean;
  last_seen_marker_name: string | null;
}

interface GolfCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  club_id: string | null;
}

const GBI = "Britain & Ireland";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode = body.mode ?? "bulk";

    if (mode === "single") {
      const id = body.whs_course_id;
      if (!id) return json({ error: "whs_course_id required" }, 400);
      const result = await processOne(supabase, id);
      return json(result);
    }

    // Bulk: find whs_courses without a corresponding map row, in chunks.
    const { data: mapped } = await supabase
      .from("whs_to_golf_course_map")
      .select("whs_course_id")
      .limit(50000);
    const mappedIds = new Set<string>(
      (mapped ?? []).map((m: any) => m.whs_course_id),
    );

    const { data: allCourses } = await supabase
      .from("whs_courses")
      .select("id")
      .limit(50000);

    const unmatched =
      (allCourses ?? []).filter((r: any) => !mappedIds.has(r.id)).slice(0, 500);

    if (unmatched.length === 0) {
      return json({ processed: 0, message: "No unmatched courses" });
    }

    const counts: Record<string, number> = {
      exact_name: 0,
      normalised_name: 0,
      trigram_high: 0,
      trigram_medium: 0,
      marker_aware: 0,
      no_match_found: 0,
    };
    let processed = 0;
    for (const row of unmatched) {
      const result = await processOne(supabase, row.id);
      counts[result.match_method] = (counts[result.match_method] ?? 0) + 1;
      processed++;
    }

    return json({ processed, counts });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

async function processOne(supabase: any, whsCourseId: string) {
  const { data: whsCourse } = await supabase
    .from("whs_courses")
    .select(
      "id, name, country_code, country_name, is_linked_to_multi_course_club, last_seen_marker_name",
    )
    .eq("id", whsCourseId)
    .maybeSingle();

  if (!whsCourse) {
    return {
      whs_course_id: whsCourseId,
      match_method: "no_match_found",
      error: "not_found",
    };
  }

  const exact = await findExactMatch(supabase, whsCourse);
  if (exact) {
    await persist(supabase, whsCourseId, exact.id, 1.0, "exact_name");
    return {
      whs_course_id: whsCourseId,
      golf_course_id: exact.id,
      match_confidence: 1.0,
      match_method: "exact_name",
    };
  }

  const norm = await findNormalisedMatch(supabase, whsCourse);
  if (norm) {
    await persist(supabase, whsCourseId, norm.id, 1.0, "normalised_name");
    return {
      whs_course_id: whsCourseId,
      golf_course_id: norm.id,
      match_confidence: 1.0,
      match_method: "normalised_name",
    };
  }

  const tri = await findTrigramMatch(supabase, whsCourse);
  if (tri && tri.similarity >= 0.85) {
    await persist(supabase, whsCourseId, tri.id, tri.similarity, "trigram_high");
    return {
      whs_course_id: whsCourseId,
      golf_course_id: tri.id,
      match_confidence: tri.similarity,
      match_method: "trigram_high",
    };
  }
  if (tri && tri.similarity >= 0.7) {
    await persist(
      supabase,
      whsCourseId,
      tri.id,
      tri.similarity,
      "trigram_medium",
    );
    return {
      whs_course_id: whsCourseId,
      golf_course_id: tri.id,
      match_confidence: tri.similarity,
      match_method: "trigram_medium",
    };
  }

  const marker = await findMarkerAwareMatch(supabase, whsCourse);
  if (marker) {
    await persist(supabase, whsCourseId, marker.id, 0.8, "marker_aware");
    return {
      whs_course_id: whsCourseId,
      golf_course_id: marker.id,
      match_confidence: 0.8,
      match_method: "marker_aware",
    };
  }

  await persist(supabase, whsCourseId, null, 0.0, "no_match_found");
  return {
    whs_course_id: whsCourseId,
    golf_course_id: null,
    match_confidence: 0.0,
    match_method: "no_match_found",
  };
}

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/\bgolf\s+(club|course|links)\b/g, "")
    .replace(/\bgc\b/g, "")
    .replace(/\bg\.?c\.?\b/g, "")
    .replace(/^the\s+/, "")
    .replace(/[-,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findExactMatch(
  supabase: any,
  whs: WhsCourse,
): Promise<GolfCourse | null> {
  const { data } = await supabase
    .from("golf_courses")
    .select("id, name, country, sub_country, club_id")
    .ilike("name", whs.name)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function findNormalisedMatch(
  supabase: any,
  whs: WhsCourse,
): Promise<GolfCourse | null> {
  const target = normaliseName(whs.name);
  if (!target) return null;
  const isGbi =
    whs.country_code === "GB" ||
    whs.country_code === "IE" ||
    !!whs.country_name?.match(/united kingdom|britain|ireland|scotland|wales/i);

  let query = supabase
    .from("golf_courses")
    .select("id, name, country, sub_country, club_id")
    .limit(2000);
  if (isGbi) query = query.eq("country", GBI);

  const { data: candidates } = await query;
  if (!candidates) return null;
  for (const c of candidates as GolfCourse[]) {
    if (normaliseName(c.name) === target) return c;
  }
  return null;
}

async function findTrigramMatch(
  supabase: any,
  whs: WhsCourse,
): Promise<{ id: string; similarity: number } | null> {
  const isGbi = whs.country_code === "GB" || whs.country_code === "IE";
  const { data, error } = await supabase.rpc("find_best_trigram_match", {
    input_name: whs.name,
    country_filter: isGbi ? GBI : null,
  });
  if (error) {
    console.error("trigram rpc error", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return { id: data[0].id, similarity: Number(data[0].similarity) };
}

async function findMarkerAwareMatch(
  supabase: any,
  whs: WhsCourse,
): Promise<GolfCourse | null> {
  const m = whs.name.match(
    /^(.+?)[\s-]+(east|west|north|south|old|new|red|blue|green|yellow|championship|members|main|short|extension|academy)\s+course$/i,
  );
  if (!m) return null;
  const [, clubBase, marker] = m;

  const { data: clubs } = await supabase
    .from("golf_clubs")
    .select("id")
    .ilike("name", clubBase.trim());
  if (!clubs || clubs.length === 0) return null;

  const clubIds = clubs.map((c: { id: string }) => c.id);
  const { data: courses } = await supabase
    .from("golf_courses")
    .select("id, name, country, sub_country, club_id")
    .in("club_id", clubIds);
  if (!courses) return null;

  return (
    (courses as GolfCourse[]).find((c) =>
      c.name.toLowerCase().includes(marker.toLowerCase()),
    ) ?? null
  );
}

async function persist(
  supabase: any,
  whsCourseId: string,
  golfCourseId: string | null,
  confidence: number,
  method: string,
) {
  await supabase.from("whs_to_golf_course_map").upsert(
    {
      whs_course_id: whsCourseId,
      golf_course_id: golfCourseId,
      match_confidence: confidence,
      match_method: method,
      matched_at: new Date().toISOString(),
    },
    { onConflict: "whs_course_id" },
  );
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
