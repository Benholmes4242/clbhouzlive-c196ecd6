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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Query auth.users directly — getUserByEmail was removed from Admin SDK
    const { data, error } = await supabaseAdmin
      .rpc('', { }).catch(() => null) as any; // unused, see below

    // Use raw PostgREST query against auth.users via service role
    const { data: user, error: queryError } = await supabaseAdmin
      .schema('auth' as any)
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (queryError) {
      console.error("[auth-email-exists] Error checking user:", queryError.message);
      return new Response(
        JSON.stringify({ error: "Failed to check email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const exists = !!user;
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
