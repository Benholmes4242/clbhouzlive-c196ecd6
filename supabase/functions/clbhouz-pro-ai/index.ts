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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise. Provide factual, up-to-date information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'week'
      }),
    });

    if (!response.ok) {
      return 'Unable to search for current information at this time.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No current information found.';
  } catch (error) {
    return 'Unable to search for current information at this time.';
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