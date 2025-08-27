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
            content: 'You are a golf expert with knowledge of famous quotes about golf courses. When asked for the best quote about a specific golf course, provide multiple options but clearly mark your "Top Pick" at the beginning of your response. The Top Pick should be the most famous, authentic, or meaningful quote about that specific course.' 
          },
          { 
            role: 'user', 
            content: `best quote about ${courseName}` 
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
    const fullResponse = data.choices[0].message.content.trim();
    
    // Extract and clean the quote from the response
    let quote = fullResponse;
    
    // Remove "Top Pick:" prefix if present
    quote = quote.replace(/^Top Pick[:\-]?\s*/i, '').trim();
    
    // Clean up markdown formatting and ** artifacts
    quote = quote.replace(/\*\*/g, '').replace(/^\*+|\*+$/g, '').trim();
    
    // Extract content within quotation marks if present
    const quotedMatch = quote.match(/[""]([^"""]+)[""]/) || quote.match(/"([^"]+)"/);
    if (quotedMatch) {
      quote = quotedMatch[1].trim();
    } else {
      // If no quotes found, take the first sentence/paragraph and stop at first period or newline
      const firstSentence = quote.split(/[\n\r]|\.(?=\s)/)[0];
      if (firstSentence && firstSentence.length > 10) {
        quote = firstSentence.trim();
        if (!quote.endsWith('.')) {
          quote += '.';
        }
      }
    }
    
    // Final fallback
    if (!quote || quote === '' || quote.length < 5) {
      quote = 'A golf experience like no other';
    }

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