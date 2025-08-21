import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("🚀🚀🚀 ECHO FUNCTION DEPLOYED SUCCESSFULLY! 🚀🚀🚀");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("📨📨📨 ECHO FUNCTION RECEIVED REQUEST! 📨📨📨");
  console.log("Method:", req.method);
  
  if (req.method === 'OPTIONS') {
    console.log("🔧 Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📋 Request body received:", JSON.stringify(body, null, 2));
    
    const message = body.message || "No message provided";
    console.log("💬 User message:", message);
    
    // Simple response for now - testing deployment
    const response = {
      response: `🔍 ECHO TEST: I received your message: "${message}". Web search functionality will be implemented once deployment is confirmed.`,
      metadata: null
    };
    
    console.log("✅ Sending response:", response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌❌❌ ERROR IN ECHO FUNCTION:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "Error processing request"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});