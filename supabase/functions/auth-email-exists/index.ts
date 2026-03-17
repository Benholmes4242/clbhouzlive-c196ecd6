import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailExistsRequest {
  email: string;
}

interface EmailExistsResponse {
  exists: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: EmailExistsRequest = await req.json();

    if (!email || typeof email !== "string") {
      console.error("[auth-email-exists] Missing or invalid email");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("[auth-email-exists] Checking email...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Query auth.users directly via PostgREST REST API with service role
    // getUserByEmail was removed from the Supabase Admin SDK
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(normalizedEmail)}&select=id`,
      {
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Accept": "application/json",
          "Accept-Profile": "auth",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[auth-email-exists] Error checking user:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to check email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const users = await response.json();
    const exists = Array.isArray(users) && users.length > 0;
    console.log(`[auth-email-exists] Email exists: ${exists}`);

    const response: EmailExistsResponse = { exists };
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[auth-email-exists] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
