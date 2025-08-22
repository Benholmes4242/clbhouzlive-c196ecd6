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
      console.log('❌ No Perplexity API key found in environment');
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
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise. Provide factual, up-to-date information about golf tournaments and player performances. Always specify the current year and provide the most recent data available.'
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
    const { message, conversation, images, detailMode, isEcho } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('📥 Request received:', { 
      message: message.substring(0, 100), 
      imagesCount: images?.length || 0
    });

    // Check if this looks like a request for current information
    const needsSearch = /(?:2024|2025|this year|last week|recent|current|latest|today|yesterday|this week|this season|won.*year|tournaments.*year|wins.*year|what.*shoot|scores?|results?|standings?|news|how many.*this|how many.*won)/i.test(message);
    
    let finalResponse = '';
    
    // Priority 1: If we have images, use OpenAI for analysis
    if (images && images.length > 0) {
      console.log('🎯 Using OpenAI for swing analysis with images:', images?.length || 0);
      
      const systemPrompt = "You are Echo, the AI assistant inside the Clbhouz app specializing in golf swing analysis. When you receive images or video frames, analyze them directly and provide detailed swing analysis without asking for additional information. Provide specific feedback on stance, grip, takeaway, backswing, downswing, impact, and follow-through. Look at each frame and provide actionable insights.";
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversation || [])
      ];

      // Create user message with images if provided
      const userMessage: any = { 
        role: 'user', 
        content: images && images.length > 0 ? [
          { type: 'text', text: message },
          ...images.map((image: string) => ({
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high'
            }
          }))
        ] : message
      };

      messages.push(userMessage);

      console.log('🚀 Sending to OpenAI with images:', images?.length || 0);
      if (images && images.length > 0) {
        console.log('📸 Image details:', images.map((img, i) => `Frame ${i + 1}: ${img.substring(0, 50)}...`));
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1200,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      finalResponse = data.choices[0].message.content.trim();
      
    } else if (needsSearch) {
      // Priority 2: Use web search for current information
      console.log('🔍 Using web search for current information');
      const searchQuery = `${message} PGA Tour 2025 golf tournaments wins`;
      const searchResult = await searchWeb(searchQuery);
      
      finalResponse = searchResult;
      
    } else {
      // Priority 3: Use OpenAI for general questions
      console.log('💬 Using OpenAI for general conversation');
      
      const systemPrompt = "You are Echo, the AI assistant inside the Clbhouz app. Be helpful and friendly.";
      
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
          max_tokens: 800,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      finalResponse = data.choices[0].message.content.trim();
    }

    console.log('✅ Response generated, length:', finalResponse.length);

    return new Response(JSON.stringify({ 
      response: finalResponse, 
      metadata: null 
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