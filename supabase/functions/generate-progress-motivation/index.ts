import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizeError } from '../_shared/normalize-error.ts';

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
    const { region, played, total, userDisplayName, isOwnProfile } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const percentage = Math.round((played / total) * 100);
    const remaining = total - played;
    const isNearCompletion = remaining <= 20 && remaining > 0;
    const isCompleted = remaining === 0;

    // Create a context-aware prompt
    const regionNames = {
      'global': 'Global Top 100',
      'usa': 'USA Top 100', 
      'britain-ireland': 'GB&I Top 100',
      'europe': 'Europe Top 100'
    };

    const regionName = regionNames[region as keyof typeof regionNames] || region;
    const pronoun = isOwnProfile ? 'you' : userDisplayName || 'they';
    const possessive = isOwnProfile ? 'your' : `${userDisplayName}'s` || 'their';

    let prompt = '';
    
    if (isCompleted) {
      prompt = `Generate a unique celebratory message (12-18 words) for someone who has completed all courses in the ${regionName} golf course list. Create a COMPLETELY DIFFERENT format from standard messages - be creative with structure. Reference the specific region's golf culture. Use "${pronoun}" and "${possessive}" appropriately. Examples of varied formats: "Links mastery achieved - 100% complete!", "Every American treasure conquered!", "Continental excellence personified - all courses complete!". Make it unique and different from other regions.`;
    } else if (isNearCompletion) {
      prompt = `Generate a unique urgent message (12-18 words) for someone who only has ${remaining} courses left in the ${regionName} golf course list (${percentage}% complete). Create a COMPLETELY DIFFERENT format - don't follow standard patterns. Be creative with how you present the progress and motivation. Reference the region's golf character. Use "${pronoun}" and "${possessive}" appropriately. Make it structurally different from other region messages.`;
    } else {
      prompt = `Generate a unique motivational message (12-18 words) for someone who has played ${played} out of ${total} courses in the ${regionName} golf course list (${percentage}% complete, ${remaining} remaining). Create a COMPLETELY DIFFERENT format and structure - don't follow standard "X courses to go (Y% complete) tagline" patterns. Be creative with how you present the progress. Reference the region's unique golf culture. Use "${pronoun}" and "${possessive}" appropriately. Examples of varied structures: "Building your Scottish legacy, 19% conquered", "America's finest await - 15 down, many adventures ahead", "Continental conquest underway, ${percentage}% explored". Make each region's message structurally unique.`;
    }

    console.log('Generating motivation for:', { region, played, total, percentage, remaining, isOwnProfile });
    console.log('Prompt:', prompt);

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
            content: 'You are a creative golf writer who creates unique, varied motivational messages. NEVER use the same format twice. Each message should have a completely different structure and style. Avoid repetitive patterns like "X courses to go (Y% complete)" - be creative with how you present progress. Make each region feel distinct with varied formatting.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 50,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const motivationalMessage = data.choices[0].message.content.trim();

    console.log('Generated message:', motivationalMessage);

    return new Response(JSON.stringify({ motivationalMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = normalizeError(error);
    console.error('Error in generate-progress-motivation function:', err.name, err.message, err.stack);
    return new Response(JSON.stringify({ 
      error: err.message,
      motivationalMessage: 'Adventure awaits on the world\'s finest courses!' // fallback
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});