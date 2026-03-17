import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Use GoTrue Admin API directly to check if user exists by email
    const fetchRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`,
      {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      }
    );

    // Alternative: use the signIn with wrong password trick won't work.
    // Use admin listUsers and filter — but that's expensive.
    // Best approach: call GoTrue's admin user lookup endpoint
    const lookupRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      }
    );

    // Consume the first fetch
    await fetchRes.text();

    if (!lookupRes.ok) {
      const errText = await lookupRes.text();
      console.error("[auth-email-exists] Error checking user:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to check email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await lookupRes.json();
    const users = data?.users ?? [];
    const exists = users.some((u: any) => u.email?.toLowerCase() === normalizedEmail);
    console.log(`[auth-email-exists] Email exists: ${exists}`);

    return new Response(
      JSON.stringify({ exists } as EmailExistsResponse),
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
