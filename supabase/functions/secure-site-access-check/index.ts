import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function pickAllowedOrigin(req: Request): string {
  const origin = req.headers.get('origin') || req.headers.get('Origin') || '';
  const allowList = [
    'https://clbhouz.co.uk',
    'https://www.clbhouz.co.uk',
    'https://clbhouz.com',
    'https://www.clbhouz.com',
    'https://app.clbhouz.co.uk',
    'https://admin.clbhouz.co.uk',
    'http://localhost:3000',
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
  ];
  // Allow Lovable preview & app subdomains
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) {
    return origin;
  }
  if (allowList.includes(origin)) {
    return origin;
  }
  // Safe fallback
  return allowList[0];
}

function makeCorsHeaders(req: Request): HeadersInit {
  const origin = pickAllowedOrigin(req);
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-requested-with",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = makeCorsHeaders(req);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ ok: false, message: "Server misconfigured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // IMPORTANT: ensure the client sends Authorization: Bearer <accessToken>
    const authHeader = req.headers.get("Authorization") ?? "";
    console.log("[secure-site-access-check] Auth header present:", authHeader.startsWith("Bearer ") ? "yes" : "no");
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ ok: false, message: "No session found" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service-role client to bypass RLS for reliable role lookup
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!svcKey) {
      console.error("[secure-site-access-check] Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ ok: false, message: "Server misconfigured: missing SERVICE_ROLE_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const svc = createClient(supabaseUrl, svcKey);

    // Lookup role directly from admin_memberships for this user
    let mem = null;
    
    // First try with expires_at (preferred column)
    const first = await svc
      .from("admin_memberships")
      .select("role, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (first.error) {
      console.error("[secure-site-access-check] membership lookup error (first):", first.error);

      // Fallback: some environments may not have expires_at yet
      const second = await svc
        .from("admin_memberships")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (second.error) {
        console.error("[secure-site-access-check] membership lookup error (fallback):", second.error);
        return new Response(
          JSON.stringify({ ok: false, message: "Admin role check failed" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      mem = second.data;
    } else {
      mem = first.data;
    }

    // Compute effective role (honor expiry if present)
    let role: "none" | "limited" | "full" = "none";
    const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
    if (mem?.role && notExpired) {
      role = mem.role === "full" ? "full" : "limited";
    }

    const isAdmin = role === "full" || role === "limited";

    console.log("[secure-site-access-check] Role result:", { user_id: user.id, role, is_admin: isAdmin });

    return new Response(
      JSON.stringify({ ok: true, user_id: user.id, is_admin: isAdmin, role }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in secure-site-access-check:", error);
    return new Response(
      JSON.stringify({ ok: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
