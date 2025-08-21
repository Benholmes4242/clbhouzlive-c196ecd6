import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function searchWeb(query: string): Promise<string> {
  console.log(`Searching for: ${query}`);
  
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
            content: 'Be precise and concise. Provide factual, up-to-date information. Focus on the most relevant and recent information available.'
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
      console.error('Perplexity API error:', response.status, response.statusText);
      return 'Unable to search for current information at this time.';
    }

    const data = await response.json();
    const searchResult = data.choices?.[0]?.message?.content || 'No current information found.';
    console.log('Search result:', searchResult);
    return searchResult;
  } catch (error) {
    console.error('Error searching web:', error);
    return 'Unable to search for current information at this time.';
  }
}

const systemPrompt = `You are clbhouz caddie AI, an AI assistant inside the Clbhouz app.
Tone: friendly, crisp, practical — like a knowledgeable coach + concierge.
Audience: users seeking helpful information and assistance.

IMPORTANT: All answers must be provided within the Clubhouse chat overlay only. Do not provide, suggest, or link out to any external websites, apps, or companies. If a user asks for something that would normally require an external link, instead give the answer directly in text form or suggest they explore it inside Clubhouse.

Scope: Answer any questions users have - golf-related questions like swing, drills, equipment, courses, trips, rules, etiquette, fitness, travel, and news, as well as general knowledge questions, current events, sports, entertainment, technology, etc. Be helpful and informative on any topic.

TOOL USAGE: You have access to a web search function called "search_web" that can help you find current, real-time information. Use this when users ask about:
- Recent sports scores, results, or current tournament standings
- Current news, events, or breaking news
- Recent developments in any field
- Current weather, stock prices, or other real-time data
- Any question that requires information more recent than your training data

When you need current information, call the search_web function with a specific, targeted search query.

Default Output Shape for swing-related questions (Fast Answer):

**Why it's happening**
- [1–2 bullets diagnosing the issue]

**Fast fix**
1) [3-point quick fix]

**Try this drill**
- [1 short drill]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[120 char summary]","tags":["tag1","tag2"],"category":"Swing"}

For travel requests (Trip Planning Template):

**Trip Idea: [Trip Title]**
- Course 1 (Day 1)
- Course 2 (Day 2)
- Course 3 (Day 3)
- Course 4 (Day 4)
- Course 5 (Day 5)

**Why it works**
- [3 bullets on region, variety, logistics]

**Tip**
- [1–2 bullets with booking/travel tips]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[Trip summary]","tags":["travel","courses","destination"],"category":"Courses"}

Rules:
- Always use headings + bullets
- Fast Answer = concise, under 1 min read
- Always append ::clbhz_meta:: JSON at the end
- If location missing for "near me" queries, ask once for city/postcode
- Always finish Fast Answers with: "Want this saved to Insights?"`;

const proAISystemPrompt = `You are clbhouz Pro AI, a professional golf swing analyzer inside the Clbhouz app.
Tone: expert, analytical, precise — like a tour-level swing coach with biomechanics expertise.
Audience: golfers seeking detailed swing analysis and improvement.

CRITICAL: When you receive visual data (images/video frames), you are analyzing an actual golf swing. Analyze what you see in the visuals and provide specific, actionable feedback based on the swing positions shown.

IMPORTANT: All answers must be provided within the Clubhouse chat overlay only. Do not provide, suggest, or link out to any external websites, apps, or companies.

Scope: Analyze golf swings from video/images, provide technical feedback on swing mechanics, suggest drills for specific swing faults, and answer swing-related questions. If someone asks a non-swing question, reply: "I specialize in swing analysis. Upload a swing video or ask about swing mechanics for the best help!"

Default Output Shape for swing-related questions (Fast Answer):

**Why it's happening**
- [1–2 bullets diagnosing the issue]

**Fast fix**
1) [3-point quick fix]

**Try this drill**
- [1 short drill]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[120 char summary]","tags":["tag1","tag2"],"category":"Swing"}

For travel requests (Trip Planning Template):

**Trip Idea: [Trip Title]**
- Course 1 (Day 1)
- Course 2 (Day 2)
- Course 3 (Day 3)
- Course 4 (Day 4)
- Course 5 (Day 5)

**Why it works**
- [3 bullets on region, variety, logistics]

**Tip**
- [1–2 bullets with booking/travel tips]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[Trip summary]","tags":["travel","courses","destination"],"category":"Courses"}

Rules:
- Always use headings + bullets
- Fast Answer = concise, under 1 min read
- Always append ::clbhz_meta:: JSON at the end
- If location missing for "near me" queries, ask once for city/postcode
- Always finish Fast Answers with: "Want this saved to Insights?"`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation, detailMode = false, images, isProAI = false, swingContext } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Choose system prompt based on mode
    const selectedSystemPrompt = isProAI ? proAISystemPrompt : systemPrompt;

    let userMessage = message;
    let messageContent = [];

    // Handle swing analysis with visual data
    if (images && images.length > 0) {
      console.log('Video data provided, using GPT-4o for swing analysis');
      
      // Create analysis instruction for frames
      const analysisInstruction = `You received visual data of a golf swing. Analyze this swing systematically:

1. SETUP & ADDRESS: Check posture, ball position, grip, alignment, stance width
2. TAKEAWAY: Initial club movement, body rotation, arm/wrist action
3. BACKSWING: Plane, width, turn, positions at parallel and top
4. TRANSITION: Hip movement, sequence, club position changes
5. DOWNSWING: Attack angle, club path, body rotation sequence
6. IMPACT: Club face, path, body position, weight transfer
7. FOLLOW-THROUGH: Extension, balance, finish position

Context provided: ${swingContext ? `${swingContext.club || 'Unknown club'} • ${swingContext.miss || 'No specific miss mentioned'} • ${swingContext.angle || 'Unknown angle'}` : 'No additional context provided'}

Respond in this exact format:

**Why it's happening**
- [1-2 bullets diagnosing the main issue you see]

**Fast fix** 
1) [3-point quick fix with specific setup/feel changes]

**Try this drill**
- [1 specific drill targeting the main issue]

Want this saved to Insights?

::clbhz_meta:: {"save_card":"[120 char summary of analysis]","tags":["swing","analysis","specific_fault"],"category":"Swing"}`;

      messageContent = [
        {
          type: "text",
          text: analysisInstruction
        },
        ...images.map((image: string) => ({
          type: "image_url",
          image_url: {
            url: image
          }
        }))
      ];
    } else if (detailMode) {
      userMessage = `${message} - Explain fully with more detail.`;
      messageContent = userMessage;
    } else {
      messageContent = userMessage;
    }

    const messages = [
      { role: 'system', content: selectedSystemPrompt },
      ...(conversation || []),
      { role: 'user', content: messageContent }
    ];

    console.log('Sending request to OpenAI with messages:', messages);

    // Use vision model for image analysis
    const model = images && images.length > 0 ? 'gpt-4o' : 'gpt-4o-mini';
    const requestBody: any = {
      model: model,
      messages: messages,
    };

    // Add function calling for web search (only for non-image requests)
    if (!images || images.length === 0) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "search_web",
            description: "Search the web for current, real-time information. Use this for recent sports scores, news, current events, or any information that requires up-to-date data.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to find current information"
                }
              },
              required: ["query"]
            }
          }
        }
      ];
      requestBody.tool_choice = "auto";
    }

    // Add appropriate token limits based on model
    if (model === 'gpt-4o' || model === 'gpt-4o-mini') {
      requestBody.max_tokens = detailMode ? 800 : 400;
      requestBody.temperature = 0.7;
    }

    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    let data = await response.json();
    let aiMessage = data.choices[0].message;

    // Handle function calls
    if (aiMessage.tool_calls) {
      console.log('AI wants to use tools:', aiMessage.tool_calls);
      
      // Add the assistant's message with tool calls to the conversation
      messages.push(aiMessage);
      
      // Process each tool call
      for (const toolCall of aiMessage.tool_calls) {
        if (toolCall.function.name === 'search_web') {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Searching web with query:', args.query);
          
          const searchResult = await searchWeb(args.query);
          
          // Add the function result to the conversation
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }
      
      // Make another request to OpenAI with the function results
      const followUpRequestBody = {
        model: model,
        messages: messages,
        max_tokens: detailMode ? 800 : 400,
        temperature: 0.7
      };
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(followUpRequestBody),
      });
      
      if (!response.ok) {
        console.error('OpenAI API error on follow-up:', response.status, response.statusText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      data = await response.json();
      aiMessage = data.choices[0].message;
    }

    const aiResponse = aiMessage.content.trim();

    console.log('Generated AI response:', aiResponse);

    // Extract metadata if present
    const metaMatch = aiResponse.match(/::clbhz_meta::\s*({.*?})/);
    let metadata = null;
    let responseText = aiResponse;

    if (metaMatch) {
      try {
        metadata = JSON.parse(metaMatch[1]);
        responseText = aiResponse.replace(/::clbhz_meta::\s*{.*?}/, '').trim();
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    return new Response(JSON.stringify({ 
      response: responseText,
      metadata: metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in clbhouz-pro-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate AI response',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});