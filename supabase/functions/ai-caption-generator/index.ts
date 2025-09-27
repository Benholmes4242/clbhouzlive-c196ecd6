import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, previewUrl, captionContext } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a creative caption writer for golf social media posts. 
    
Given a ${type} with context: "${captionContext || 'No existing caption'}"

Write an engaging, authentic golf caption that:
- Is 1-2 sentences maximum  
- Uses casual, enthusiastic tone
- Includes relevant golf terminology naturally
- Ends with 1-2 appropriate golf-related emojis
- Avoids clichés and generic phrases

Examples:
- "Absolutely crushed this drive down the fairway! Nothing beats that perfect contact feeling ⛳️🔥"
- "Course conditions were perfect today - couldn't have asked for better weather to work on my short game 🏌️‍♂️✨"
- "This approach shot was exactly what the round needed! Pin-high and ready to make some magic happen 🎯⛳️"

Generate a unique caption now:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a creative golf social media caption writer. Keep captions authentic, engaging, and concise.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const caption = data.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error('No caption generated');
    }

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-caption-generator function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Failed to generate caption'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});