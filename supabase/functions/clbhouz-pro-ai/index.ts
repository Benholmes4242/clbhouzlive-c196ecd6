import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are clbhouz Pro AI, a professional golf swing analyzer inside the Clbhouz app.
Tone: expert, analytical, precise — like a tour-level swing coach with biomechanics expertise.
Audience: golfers seeking detailed swing analysis and improvement.

CRITICAL: When you receive visual data (images/video frames), you are analyzing an actual golf swing. Analyze what you see in the visuals and provide specific, actionable feedback based on the swing positions shown.

IMPORTANT: All answers must be provided within the Clubhouse chat overlay only. Do not provide, suggest, or link out to any external websites, apps, or companies.

Scope: Analyze golf swings from video/images, provide technical feedback on swing mechanics, suggest drills for specific swing faults, and answer swing-related questions. If someone asks a non-swing question, reply: "I specialize in swing analysis. Upload a swing video or ask about swing mechanics for the best help!"

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
    const { message, conversation, detailMode = false, videoData, fileName } = await req.json();

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
    ];

    // If video/image data is provided, use vision capabilities
    if (videoData) {
      console.log('Video data provided, using GPT-4o for swing analysis');
      
      // Enhanced swing analysis prompt
      const analysisPrompt = `You received visual data of a golf swing. Analyze this swing systematically:

1. SETUP & ADDRESS: Check posture, ball position, grip, alignment, stance width
2. TAKEAWAY: Initial club movement, body rotation, arm/wrist action
3. BACKSWING: Plane, width, turn, positions at parallel and top
4. TRANSITION: Hip movement, sequence, club position changes
5. DOWNSWING: Attack angle, club path, body rotation sequence
6. IMPACT: Club face, path, body position, weight transfer
7. FOLLOW-THROUGH: Extension, balance, finish position

Context provided: ${fileName ? `File: ${fileName}` : ''} ${userMessage}

Respond in this exact format:

**Why it's happening**
- [1-2 bullets diagnosing the main issue you see]

**Fast fix** 
1) [3-point quick fix with specific setup/feel changes]

**Try this drill**
- [1 specific drill targeting the main issue]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[120 char summary of analysis]","tags":["swing","analysis","specific_fault"],"category":"Swing"}`;

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: analysisPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: videoData
            }
          }
        ]
      });
    } else {
      // For text-only questions about swing mechanics
      const textPrompt = `${userMessage}

Provide swing advice in this format:

**Quick answer**
- [Direct response to the question]

**Key points**
- [2-3 most important technical points]

**Practice tip**
- [One actionable drill or practice method]

::clbhz_meta:: {"save_card":"[Summary of advice]","tags":["swing","technique"],"category":"Swing"}`;
      
      messages.push({ role: 'user', content: textPrompt });
    }

    console.log('Sending request to OpenAI with messages:', messages);

    const requestBody = {
      model: videoData ? 'gpt-4o' : 'gpt-4o-mini',
      messages: messages,
      max_tokens: detailMode ? 1200 : 800,
      temperature: 0.3, // Lower temperature for more consistent analysis
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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