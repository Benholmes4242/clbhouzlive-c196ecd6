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
      'global': 'Worldwide Top 100',
      'usa': 'USA Top 100', 
      'britain-ireland': 'Great Britain & Ireland Top 100',
      'europe': 'Continental Europe Top 100'
    };

    const regionName = regionNames[region as keyof typeof regionNames] || region;
    const pronoun = isOwnProfile ? 'you' : userDisplayName || 'they';
    const possessive = isOwnProfile ? 'your' : `${userDisplayName}'s` || 'their';

    let prompt = '';
    
    if (isCompleted) {
      prompt = `Generate a single combined message (15-20 words) that includes both completion status and celebration for someone who has completed all courses in the ${regionName} golf course list. Format: "Achievement unlocked! (100% complete) [celebratory tagline referencing the region]". Use "${pronoun}" and "${possessive}" appropriately.`;
    } else if (isNearCompletion) {
      prompt = `Generate a single combined message (15-20 words) that includes progress and excitement for someone who only has ${remaining} courses left in the ${regionName} golf course list. Format: "${remaining} trips to go! (${percentage}% complete) [exciting tagline about being close]". Use "${pronoun}" and "${possessive}" appropriately.`;
    } else {
      prompt = `Generate a single combined message (15-20 words) that includes progress and motivation for someone who has played ${played} out of ${total} courses in the ${regionName} golf course list. Format: "${remaining} courses to go (${percentage}% complete) [encouraging tagline referencing the region's golf culture]". Use "${pronoun}" and "${possessive}" appropriately.`;
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
            content: 'You are a golf enthusiast who creates combined progress and motivational messages for golfers. The message should include both the numerical progress and an inspiring tagline in one cohesive sentence. Keep it concise but engaging.'
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
    console.error('Error in generate-progress-motivation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      motivationalMessage: 'Adventure awaits on the world\'s finest courses!' // fallback
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});