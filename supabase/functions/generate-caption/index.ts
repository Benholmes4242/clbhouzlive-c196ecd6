import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Daily limit per user (configurable)
const DAILY_LIMIT = 10;

// OpenAI API endpoint
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface CaptionRequest {
  tone: string;
  momentType: string;
  tokens: string[];
  courseName?: string;
  scoreText?: string;
  withText?: string;
  captionSeed?: string;
  allowEmojis: boolean;
  shortMode: boolean;
}

interface CaptionResponse {
  captions: Array<{
    text: string;
    hashtags: string[];
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[generate-caption] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-caption] Request from user: ${user.id}`);

    // Parse request body
    const body: CaptionRequest = await req.json();
    console.log("[generate-caption] Request body:", JSON.stringify(body, null, 2));

    // Check daily usage limit
    const today = new Date().toISOString().split("T")[0];
    
    const { data: usageData, error: usageError } = await supabase
      .from("ai_caption_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      // PGRST116 = no rows found (which is fine for first use)
      console.error("[generate-caption] Usage check error:", usageError);
    }

    const currentCount = usageData?.count || 0;
    
    if (currentCount >= DAILY_LIMIT) {
      console.log(`[generate-caption] Daily limit reached for user ${user.id}: ${currentCount}/${DAILY_LIMIT}`);
      return new Response(
        JSON.stringify({ 
          error: "limit_reached",
          message: "Daily caption limit reached. Try again tomorrow.",
          limit: DAILY_LIMIT,
          used: currentCount 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[generate-caption] OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt
    const maxChars = body.shortMode ? 80 : 160;
    const emojiInstruction = body.allowEmojis 
      ? "Include 1-3 relevant emojis naturally in the captions."
      : "Do NOT include any emojis.";
    
    const contextParts: string[] = [];
    if (body.courseName) contextParts.push(`Course: ${body.courseName}`);
    if (body.scoreText) contextParts.push(`Score: ${body.scoreText}`);
    if (body.withText) contextParts.push(`Playing with: ${body.withText}`);
    if (body.tokens && body.tokens.length > 0) {
      contextParts.push(`Key moments: ${body.tokens.join(", ")}`);
    }
    
    const contextSection = contextParts.length > 0 
      ? `\n\nContext:\n${contextParts.join("\n")}`
      : "";

    const systemPrompt = `You are an expert golf social media caption writer. Generate engaging, authentic captions for golf-related posts.

CRITICAL RULES:
1. Output EXACTLY 3 unique caption options
2. Each caption must be ${maxChars} characters or less
3. Each caption should have 0-3 relevant hashtags (only golf-related, no spam)
4. No @mentions allowed
5. Avoid repetition across the three options - each should have a distinct voice/angle
6. Keep content safe and appropriate for all audiences
7. ${emojiInstruction}
8. Make captions feel authentic to the golf community, not generic
9. Don't be cheesy or over-the-top - aim for genuine golfer voice

TONE GUIDELINES:
- Classic: Timeless, respectful, understated elegance
- Funny: Witty, self-deprecating golf humor, relatable struggles
- Hype: High energy, celebrating wins, motivational
- Minimal: Short, punchy, less is more
- Story: Narrative, descriptive, painting a picture

You MUST respond with valid JSON in this exact format:
{
  "captions": [
    { "text": "Caption text here", "hashtags": ["#golf", "#birdie"] },
    { "text": "Second caption option", "hashtags": ["#golflife"] },
    { "text": "Third caption option", "hashtags": [] }
  ]
}`;

    const userPrompt = `Generate 3 golf social media captions.

Tone: ${body.tone || "Classic"}
Moment Type: ${body.momentType || "Casual Round"}${contextSection}

Remember: max ${maxChars} chars per caption, ${body.allowEmojis ? "emojis allowed" : "no emojis"}, respond with valid JSON only.`;

    console.log("[generate-caption] Calling OpenAI...");
    
    // Call OpenAI
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[generate-caption] OpenAI error:", openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("[generate-caption] OpenAI response received");

    // Parse the response
    let captionResponse: CaptionResponse;
    try {
      const content = openaiData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      captionResponse = JSON.parse(content);
      
      // Validate structure
      if (!captionResponse.captions || !Array.isArray(captionResponse.captions)) {
        throw new Error("Invalid response structure");
      }
      
      // Ensure we have exactly 3 captions
      captionResponse.captions = captionResponse.captions.slice(0, 3);
      
      // Sanitize each caption
      captionResponse.captions = captionResponse.captions.map(c => ({
        text: (c.text || "").slice(0, maxChars),
        hashtags: Array.isArray(c.hashtags) ? c.hashtags.slice(0, 3) : [],
      }));
      
    } catch (parseError) {
      console.error("[generate-caption] Parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update usage counter
    const { error: upsertError } = await supabase
      .from("ai_caption_usage")
      .upsert({
        user_id: user.id,
        usage_date: today,
        count: currentCount + 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,usage_date",
      });

    if (upsertError) {
      console.error("[generate-caption] Failed to update usage:", upsertError);
      // Don't fail the request, just log it
    } else {
      console.log(`[generate-caption] Updated usage for user ${user.id}: ${currentCount + 1}/${DAILY_LIMIT}`);
    }

    console.log("[generate-caption] Success - returning 3 captions");
    
    return new Response(
      JSON.stringify(captionResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[generate-caption] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
