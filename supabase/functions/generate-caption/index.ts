import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Daily limit per user
const DAILY_LIMIT = 10;

interface CaptionRequest {
  tone: string;
  momentType: string;
  tokens: string[];
  courseName?: string;
  scoreText?: string;
  withText?: string;
  allowEmojis?: boolean;
  shortMode?: boolean;
}

interface CaptionResponse {
  text: string;
  hashtags: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create supabase client with user's auth
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[generate-caption] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check usage limit
    const { data: usageRow, error: usageError } = await supabaseAuth
      .from('ai_caption_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();

    if (usageError) {
      console.error('[generate-caption] Usage check error:', usageError);
    }

    const currentCount = usageRow?.count ?? 0;
    
    if (currentCount >= DAILY_LIMIT) {
      console.log(`[generate-caption] User ${userId} hit daily limit: ${currentCount}/${DAILY_LIMIT}`);
      return new Response(JSON.stringify({ 
        error: 'limit_reached',
        message: 'Daily caption limit reached. Try again tomorrow.',
        remaining: 0 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body: CaptionRequest = await req.json();
    const {
      tone = 'classic',
      momentType = 'Casual Round',
      tokens = [],
      courseName,
      scoreText,
      withText,
      allowEmojis = true,
      shortMode = false,
    } = body;

    console.log(`[generate-caption] Request from ${userId}: tone=${tone}, type=${momentType}, tokens=${tokens.length}`);

    // Build prompt
    const maxChars = shortMode ? 80 : 160;
    const tokenList = tokens.length > 0 ? tokens.join(', ') : 'none specified';
    const courseInfo = courseName ? `Course: ${courseName}` : '';
    const scoreInfo = scoreText ? `Score: ${scoreText}` : '';
    const companionInfo = withText ? `Playing with: ${withText}` : '';
    const contextParts = [courseInfo, scoreInfo, companionInfo].filter(Boolean).join('\n');

    const systemPrompt = `You are a golf social media caption writer. Generate exactly 3 unique, engaging captions for a golf moment post.

Rules:
- Each caption must be max ${maxChars} characters
- Tone: ${tone} (classic=straightforward, funny=humorous/witty, hype=excited/energetic, minimal=brief/understated, story=narrative)
- Moment type: ${momentType}
- ${allowEmojis ? 'Include 1-3 relevant emojis per caption' : 'No emojis'}
- Include 0-3 relevant hashtags per caption (golf-focused, no spam)
- No @mentions
- Safe content only
- Each caption should feel distinct and offer variety
- Make them feel authentic to how real golfers post

Context tokens (incorporate if relevant): ${tokenList}
${contextParts ? `\nAdditional context:\n${contextParts}` : ''}

Output format (strict JSON):
{
  "captions": [
    {"text": "caption 1 text", "hashtags": ["#tag1", "#tag2"]},
    {"text": "caption 2 text", "hashtags": ["#tag1"]},
    {"text": "caption 3 text", "hashtags": []}
  ]
}`;

    // Call OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 3 ${tone} captions for a ${momentType} golf moment.` }
        ],
        temperature: 0.9,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[generate-caption] OpenAI error:', openAIResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate captions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    const content = openAIData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[generate-caption] No content in OpenAI response');
      return new Response(JSON.stringify({ error: 'Failed to generate captions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed: { captions: CaptionResponse[] };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('[generate-caption] Failed to parse OpenAI response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse captions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate response structure
    if (!Array.isArray(parsed.captions) || parsed.captions.length === 0) {
      console.error('[generate-caption] Invalid captions structure:', parsed);
      return new Response(JSON.stringify({ error: 'Invalid caption format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage count
    if (usageRow) {
      await supabaseAuth
        .from('ai_caption_usage')
        .update({ count: currentCount + 1 })
        .eq('user_id', userId)
        .eq('usage_date', today);
    } else {
      await supabaseAuth
        .from('ai_caption_usage')
        .insert({ user_id: userId, usage_date: today, count: 1 });
    }

    const remaining = DAILY_LIMIT - (currentCount + 1);
    console.log(`[generate-caption] Success for ${userId}. Remaining: ${remaining}`);

    return new Response(JSON.stringify({
      captions: parsed.captions.slice(0, 3),
      remaining,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-caption] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
