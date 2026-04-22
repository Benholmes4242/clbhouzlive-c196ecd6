// Generate AI "why this course" blurb for the Explore tab.
// Stores result in course_mood_blurbs cache (30-day TTL, or 7-day if LLM fallback was used).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_MOODS = [
  "foryou", "weekend", "friends", "hidden", "bucket", "hero_feature",
  "watch_of_week", "clip_of_week", "video_of_week",
];

const POST_SCOPED_MOODS = new Set(["watch_of_week", "clip_of_week", "video_of_week"]);

interface RequestBody {
  course_id: string;
  user_id?: string | null;
  mood: string;
  post_id?: string | null;
}

const MOOD_CONTEXT: Record<string, string> = {
  foryou: "This is a 'for you' recommendation based on the user's taste",
  weekend: "This is a 'weekend / near me' recommendation — a course within easy reach",
  friends: "This is a 'friends played' recommendation — friends of the user have recently played here",
  hidden: "This is a 'hidden gem' recommendation — well-rated but under-the-radar",
  bucket: "This is a 'bucket list' recommendation — widely wishlisted by the community",
  hero_feature: "This is a featured editorial pick",
  watch_of_week: "Editorial 'Watch of the Week' on the Watch tab. Reference the user's played courses if relevant. Keep to 1-2 sentences.",
  clip_of_week: "Editorial 'Clip of the Week' — short-form quick-hit. Why is THIS clip worth watching? 1-2 sentences.",
  video_of_week: "Editorial 'Video of the Week' — long-form pick. What's the time investment payoff? 1-2 sentences.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    if (!body.course_id || !body.mood || !VALID_MOODS.includes(body.mood)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid course_id / mood" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Course details
    const { data: course, error: courseErr } = await supabase
      .from("golf_courses")
      .select(
        "id, name, country, sub_country, region, course_type, description, has_hosted_major, major_championships",
      )
      .eq("id", body.course_id)
      .maybeSingle();

    if (courseErr || !course) {
      return new Response(
        JSON.stringify({ error: "Course not found", details: courseErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Rating aggregates
    const { data: agg } = await supabase
      .from("course_rating_aggregates")
      .select("avg_overall_score, review_count")
      .eq("course_id", body.course_id)
      .maybeSingle();

    const ratingAvg = agg?.avg_overall_score
      ? Number(agg.avg_overall_score).toFixed(1)
      : "no rating yet";
    const reviewCount = agg?.review_count ?? 0;

    // 3. User's top-rated courses (only if user provided)
    let userCourseList = "no review history yet";
    if (body.user_id) {
      const { data: userTop } = await supabase
        .from("course_ratings")
        .select("rating, golf_courses!inner(name, course_type)")
        .eq("user_id", body.user_id)
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(5);
      if (userTop && userTop.length > 0) {
        userCourseList = userTop
          .map((r: any) => {
            const gc = r.golf_courses;
            return `- ${gc?.name ?? "Unknown"}${gc?.course_type ? ` (${gc.course_type})` : ""}: ${r.rating}/10`;
          })
          .join("\n");
      }
    }

    const courseTypeStr = course.course_type ?? "golf";
    const locationStr = course.sub_country ?? course.country ?? "";
    const notable = course.has_hosted_major && course.major_championships?.length
      ? `Has hosted: ${(course.major_championships as string[]).join(", ")}`
      : "no major championships hosted";

    const prompt = `You are writing a single 2-3 sentence paragraph explaining why a specific golf course is being recommended to a user. Write in British English, restrained voice, no hype or adjective stacking.

Course: ${course.name}, ${locationStr} (${courseTypeStr})
Rating on Clbhouz: ${ratingAvg} from ${reviewCount} reviews
Notable: ${notable}
Description: ${course.description ?? "none"}

User's highest-rated courses (for reference):
${userCourseList}

Mood: ${body.mood}
Mood context: ${MOOD_CONTEXT[body.mood]}

Write a 2-3 sentence paragraph that:
1. Cites concrete facts from the course data (course_type, rating, notable features)
2. ${body.user_id && userCourseList !== "no review history yet"
  ? `Only compare the recommended course to a course from the user's list IF the two share course_type OR country OR a clear architectural family (e.g. both heathland, both links, both parkland). If no genuine similarity exists, omit the user-anchor sentence entirely and write 2 sentences about the recommended course alone — do NOT force a comparison.`
  : "Avoids personal references since the user has no review history"}
3. Avoids invented details (no fake designer names, no fake history). Only cite facts present in the data block above.
4. Uses British English
5. Does not exceed 3 sentences
6. Returns ONLY the paragraph text — no preamble, no quotes, no labels`;

    // 4. Call Lovable AI Gateway with 5s timeout
    let blurb: string | null = null;
    let usedFallback = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const data = await aiRes.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 20) {
          blurb = content;
        }
      } else {
        console.warn("AI gateway non-OK:", aiRes.status, await aiRes.text());
      }
    } catch (err) {
      console.warn("AI gateway error:", err);
    }

    // 5. Local fallback synthesis
    if (!blurb) {
      usedFallback = true;
      const majorClause = course.has_hosted_major && course.major_championships?.length
        ? ` Host of the ${(course.major_championships as string[])[0]}.`
        : "";
      blurb = `A ${courseTypeStr} course in ${locationStr || "an unspecified region"}, rated ${ratingAvg} on Clbhouz from ${reviewCount} reviews.${majorClause}`;
    }

    // 6. Upsert into cache
    const ttlDays = usedFallback ? 7 : 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertErr } = await supabase
      .from("course_mood_blurbs")
      .upsert(
        {
          course_id: body.course_id,
          user_id: body.user_id ?? null,
          mood: body.mood,
          blurb,
          generated_at: new Date().toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: "course_id,user_id,mood", ignoreDuplicates: false },
      );

    if (upsertErr) {
      // Try delete+insert if onConflict failed (because of NULL user_id semantics)
      await supabase
        .from("course_mood_blurbs")
        .delete()
        .eq("course_id", body.course_id)
        .eq("mood", body.mood)
        .is("user_id", body.user_id ?? null);

      const { error: insertErr } = await supabase.from("course_mood_blurbs").insert({
        course_id: body.course_id,
        user_id: body.user_id ?? null,
        mood: body.mood,
        blurb,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      if (insertErr) {
        return new Response(
          JSON.stringify({ error: "Cache write failed", details: insertErr.message, blurb }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({
        blurb,
        used_fallback: usedFallback,
        ttl_days: ttlDays,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-course-mood-blurb error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
