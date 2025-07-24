import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccessValidationRequest {
  accessCode: string;
  domain: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessCode, domain }: AccessValidationRequest = await req.json();

    // Rate limiting check (simple implementation)
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `access_attempts_${clientIP}`;
    
    // In production, you'd use Redis or similar for rate limiting
    // For now, we'll just log attempts for monitoring
    console.log(`Site access attempt from IP: ${clientIP}, domain: ${domain}`);

    // Validate access codes (these should be stored securely in environment variables)
    const validAccessCodes = [
      Deno.env.get("SITE_ACCESS_CODE_1") || "CLBHOUZ2024",
      Deno.env.get("SITE_ACCESS_CODE_2") || "DEV-ACCESS-2024",
      Deno.env.get("ADMIN_OVERRIDE_CODE") || "ADMIN-OVERRIDE"
    ];

    const isValidCode = validAccessCodes.includes(accessCode.toUpperCase());

    if (isValidCode) {
      // Log successful access
      console.log(`Valid site access granted for domain: ${domain}, IP: ${clientIP}`);
      
      // Generate a secure session token (in production, use proper JWT)
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Access granted",
          sessionToken,
          expiresAt: expiresAt.toISOString()
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      // Log failed attempt for security monitoring
      console.warn(`Failed site access attempt - Code: ${accessCode}, IP: ${clientIP}, Domain: ${domain}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid access code"
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in validate-site-access function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Internal server error" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);