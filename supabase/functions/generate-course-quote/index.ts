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
            content: 'You are a golf course expert with deep knowledge of famous golf courses worldwide. For each course, create a unique, poetic quote (8-12 words) that captures what makes that SPECIFIC course legendary. Consider the course\'s: signature holes, dramatic landscapes, historical moments, architectural features, and unique challenges. Examples: "Where the ocean meets golfing perfection" (Pebble Beach), "Links golf at its most sublime" (St. Andrews), "Drama carved into coastal cliffs" (for clifftop courses). Be specific to each course\'s identity.' 
          },
          { 
            role: 'user', 
            content: `Create a distinctive quote for "${courseName}"${country ? ` in ${country}` : ''}. Think about what golfers and experts say about this specific course - its signature features, famous holes, setting, or what makes it stand out from other courses. Create a poetic quote that only applies to THIS course, not generic golf language.` 
          }
        ],
        max_tokens: 60,
        temperature: 0.9,
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