import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 FUNCTION STARTED - This MUST appear in logs');
  
  if (req.method === 'OPTIONS') {
    console.log('📝 OPTIONS request received');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📝 POST request received');

  try {
    const body = await req.json();
    console.log('📝 Body parsed:', JSON.stringify(body, null, 2));
    
    const { message } = body;
    console.log('📝 Message extracted:', message);

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    console.log('🔑 OpenAI key present:', !!openAIApiKey);
    console.log('🔑 Perplexity key present:', !!perplexityKey);

    if (!openAIApiKey) {
      console.log('❌ No OpenAI key found');
      throw new Error('OpenAI API key not configured');
    }

    // ALWAYS try Perplexity first for testing
    if (perplexityKey) {
      console.log('🔍 Attempting Perplexity API call...');
      
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-medium-online',
            messages: [
              {
                role: 'user',
                content: message
              }
            ]
          }),
        });

        console.log('📡 Perplexity response status:', perplexityResponse.status);

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          console.log('✅ Perplexity success!');
          const result = perplexityData.choices?.[0]?.message?.content || 'No response';
          
          return new Response(JSON.stringify({ 
            response: `✅ PERPLEXITY SUCCESS! ${result}`, 
            metadata: { source: 'perplexity_working' }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const errorText = await perplexityResponse.text();
          console.log('❌ Perplexity failed:', perplexityResponse.status, errorText);
          
          // Return the error details in the response since logs aren't working
          return new Response(JSON.stringify({ 
            response: `❌ PERPLEXITY FAILED: Status ${perplexityResponse.status} - ${errorText.substring(0, 200)}. This is why you're getting 2023 data instead of current information.`,
            metadata: { source: 'perplexity_error', status: perplexityResponse.status, error: errorText }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.log('❌ Perplexity error:', error.message);
        
        return new Response(JSON.stringify({ 
          response: `❌ PERPLEXITY ERROR: ${error.message}. This is why you're getting 2023 data instead of current information.`,
          metadata: { source: 'perplexity_exception', error: error.message }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ 
        response: `❌ NO PERPLEXITY KEY FOUND. API key length: ${perplexityKey?.length || 0}. This is why you're getting 2023 data instead of current information.`,
        metadata: { source: 'no_perplexity_key' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback to OpenAI
    console.log('🔄 Falling back to OpenAI...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are Echo, an AI assistant. IMPORTANT: Your knowledge cutoff is October 2023. For questions about current events in 2024/2025, clearly state that you don\'t have access to current information and recommend checking official sources like PGA Tour website.' 
          },
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const result = openAIData.choices[0].message.content.trim();
    
    console.log('✅ OpenAI fallback successful');

    return new Response(JSON.stringify({ 
      response: result, 
      metadata: { source: 'openai_fallback' }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});