import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function searchWeb(query: string): Promise<string> {
  try {
    console.log('🔍 Searching with Perplexity API for:', query);
    
    if (!perplexityApiKey) {
      console.log('❌ No Perplexity API key found');
      return 'Search functionality not configured. Please check API key.';
    }
    
    console.log('✅ Perplexity API key found, making request...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise. Provide factual, up-to-date information about golf tournaments and player performances.'
          },
          {
            role: 'user',
            content: query
          }
        ]
      }),
    });

    console.log('📡 Perplexity API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Perplexity API error:', response.status, errorText);
      return `Search temporarily unavailable (${response.status}). Please try again.`;
    }

    const data = await response.json();
    console.log('✅ Perplexity API success, processing result...');
    
    const result = data.choices?.[0]?.message?.content || 'No current information found.';
    console.log('📊 Search result length:', result.length);
    
    return result;
  } catch (error) {
    console.log('❌ Search error:', error.message);
    return `Search error: ${error.message}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation, images, detailMode, isProAI } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Check if this looks like a request for current information
    const needsSearch = /(?:last week|recent|current|latest|today|yesterday|this week|what.*shoot|scores?|results?|standings?|news)/i.test(message);
    
    let finalResponse = '';
    
    if (needsSearch && (!images || images.length === 0)) {
      // Use web search for current information
      const searchQuery = `${message} golf PGA tour recent results`;
      const searchResult = await searchWeb(searchQuery);
      
      // Create a simple response with search results
      finalResponse = `Based on the latest information I found:\n\n${searchResult}\n\nWant this saved to Insights?`;
    } else {
      // Use OpenAI for non-current information or image analysis
      const systemPrompt = isProAI ? 
        "You are Echo Pro AI, a professional golf swing analysis assistant." :
        "You are Echo, the AI assistant inside the Clbhouz app. Be helpful and friendly.";
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversation || []),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 400,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      finalResponse = data.choices[0].message.content.trim();
    }

    return new Response(JSON.stringify({ 
      response: finalResponse, 
      metadata: null 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});