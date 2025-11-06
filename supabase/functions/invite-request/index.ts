import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashIP(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  
  const json = await res.json();
  return json.success === true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, club, turnstileToken } = await req.json();
    
    if (!email || !turnstileToken) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing email or verification token" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    // Get client IP
    const ip = req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";

    console.log(`Invite request from IP: ${ip}, email: ${email}`);

    // Verify Turnstile token
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, message: "Server misconfigured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    const isValid = await verifyTurnstile(turnstileToken, turnstileSecret, ip);
    if (!isValid) {
      console.warn(`Turnstile verification failed for IP: ${ip}`);
      return new Response(
        JSON.stringify({ ok: false, message: "Bot verification failed" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert invite request
    const { error } = await supabase.from("invite_requests").insert({
      email: String(email).toLowerCase().trim(),
      name: name ?? null,
      club: club ?? null,
      source: "gate",
      ip_hash: await hashIP(ip),
      user_agent: req.headers.get("user-agent") ?? null,
    });

    // Ignore duplicate email errors (code 23505)
    if (error && error.code !== "23505") {
      console.error("Invite insert error:", error);
      return new Response(
        JSON.stringify({ ok: false, message: "Could not save request" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "content-type": "application/json" }
        }
      );
    }

    console.log(`Invite request saved successfully for: ${email}`);

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "content-type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in invite-request function:", error);
    return new Response(
      JSON.stringify({ ok: false, message: "Server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "content-type": "application/json" }
      }
    );
  }
};

serve(handler);
