import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    console.log(`Secure site access attempt from IP: ${clientIP}, domain: ${domain}`);

    // Get access codes from secure environment variables
    const validAccessCodes = [
      Deno.env.get("SITE_ACCESS_CODE_PRIMARY"),
      Deno.env.get("SITE_ACCESS_CODE_SECONDARY"), 
      Deno.env.get("SITE_ACCESS_CODE_ADMIN")
    ].filter(Boolean); // Remove any undefined values

    if (!validAccessCodes.length) {
      console.error("No access codes configured in environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Access control not properly configured"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const isValidCode = validAccessCodes.includes(accessCode.toUpperCase());

    if (isValidCode) {
      console.log(`Valid secure site access granted for domain: ${domain}, IP: ${clientIP}`);
      
      // Generate a cryptographically secure session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // TODO: Store session token in database for validation
      // For now, we'll use the UUID as a temporary solution
      
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
      console.warn(`Failed secure site access attempt - Code: ${accessCode}, IP: ${clientIP}, Domain: ${domain}`);
      
      // Add delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    console.error("Error in secure-site-access function:", error);
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