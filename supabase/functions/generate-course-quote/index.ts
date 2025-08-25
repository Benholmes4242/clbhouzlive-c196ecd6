import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { courseName, country } = await req.json();

    if (!courseName) {
      throw new Error('Course name is required');
    }

    console.log(`Generating quote for course: ${courseName} in ${country}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a golf course expert who creates inspiring, poetic, and memorable quotes about famous golf courses. Create short, elegant quotes (8-12 words max) that capture the essence, beauty, or character of each golf course. Examples: "Where golf dreams come to life", "The greatest meeting of land and sea", "A masterpiece carved by nature", "Golf perfection on hallowed ground".' 
          },
          { 
            role: 'user', 
            content: `Create an inspiring quote for ${courseName} golf course${country ? ` in ${country}` : ''}. Make it memorable and poetic, capturing what makes this course special.` 
          }
        ],
        max_tokens: 50,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data.choices[0].message.content.trim();

    console.log(`Generated quote: ${quote}`);

    return new Response(JSON.stringify({ quote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-course-quote function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});