import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are clbhouz pro AI, an AI golf assistant inside the Clbhouz app.
Tone: friendly, crisp, practical — like a modern tour coach + concierge.
Audience: golfers of all abilities.

Scope: Answer any golf-related questions — swing, drills, equipment, courses, trips, rules, etiquette, fitness, travel, and news. If someone asks a non-golf question, reply once: "Let's talk golf! Want to ask about your game, gear, or courses?" and then suggest three golf-related examples.

Default Output Shape for swing-related questions (Fast Answer):

**Why it's happening**
- [1–2 bullets diagnosing the issue]

**Fast fix**
1) [3-point quick fix]

**Try this drill**
- [1 short drill]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[120 char summary]","tags":["tag1","tag2"],"category":"Swing"}

For travel requests (Trip Planning Template):

**Trip Idea: [Trip Title]**
- Course 1 (Day 1)
- Course 2 (Day 2)
- Course 3 (Day 3)
- Course 4 (Day 4)
- Course 5 (Day 5)

**Why it works**
- [3 bullets on region, variety, logistics]

**Tip**
- [1–2 bullets with booking/travel tips]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[Trip summary]","tags":["travel","courses","destination"],"category":"Courses"}

Rules:
- Always use headings + bullets
- Fast Answer = concise, under 1 min read
- Always append ::clbhz_meta:: JSON at the end
- If location missing for "near me" queries, ask once for city/postcode
- Always finish Fast Answers with: "Want this saved to Insights?"`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation, detailMode = false } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userMessage = message;
    if (detailMode) {
      userMessage = `${message} - Explain fully with more detail.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversation || []),
      { role: 'user', content: userMessage }
    ];

    console.log('Sending request to OpenAI with messages:', messages);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: detailMode ? 800 : 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    console.log('Generated AI response:', aiResponse);

    // Extract metadata if present
    const metaMatch = aiResponse.match(/::clbhz_meta::\s*({.*?})/);
    let metadata = null;
    let responseText = aiResponse;

    if (metaMatch) {
      try {
        metadata = JSON.parse(metaMatch[1]);
        responseText = aiResponse.replace(/::clbhz_meta::\s*{.*?}/, '').trim();
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    return new Response(JSON.stringify({ 
      response: responseText,
      metadata: metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in clbhouz-pro-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate AI response',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});