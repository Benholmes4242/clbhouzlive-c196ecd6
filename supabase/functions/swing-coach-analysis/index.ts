import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🏌️ SWING COACH FUNCTION STARTED');
  
  if (req.method === 'OPTIONS') {
    console.log('📝 OPTIONS request received');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📝 POST request received');

  try {
    const body = await req.json();
    console.log('📝 Body parsed:', JSON.stringify(body, null, 2));
    
    const { message, conversation = [] } = body;
    console.log('📝 Message extracted:', message);

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔑 OpenAI key present:', !!openAIApiKey);

    if (!openAIApiKey) {
      console.log('❌ No OpenAI key found');
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔄 Calling OpenAI for swing analysis...');
    
    // Prepare conversation history for OpenAI
    const messages = [
      { 
        role: 'system', 
        content: `You are a professional golf swing coach and instructor. Your expertise includes:

- Analyzing swing mechanics and biomechanics
- Identifying common swing faults and their causes
- Providing specific, actionable improvement recommendations
- Creating personalized practice drills and exercises
- Understanding golf equipment and its impact on swing performance

When analyzing swings:
1. Be specific about what you observe in the swing sequence
2. Explain the biomechanical principles behind your recommendations
3. Provide concrete drills and practice exercises
4. Suggest progression steps for improvement
5. Consider the golfer's skill level and physical capabilities

Always maintain an encouraging and constructive tone while being technically accurate.` 
      },
      ...conversation.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
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
    
    console.log('✅ Swing analysis completed successfully');

    return new Response(JSON.stringify({ 
      response: result, 
      metadata: { source: 'swing_coach_openai' }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble analyzing your swing right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});