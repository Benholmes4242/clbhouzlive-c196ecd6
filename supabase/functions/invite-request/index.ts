import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function makeCorsHeaders(req: Request) {
  const origin = pickAllowedOrigin(req);
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

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
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    // Send Slack notification if webhook is configured
    const slackWebhook = Deno.env.get("SLACK_INVITES_WEBHOOK");
    if (slackWebhook) {
      try {
        await fetch(slackWebhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: `🟢 New gate invite: ${email}${name ? ` (${name})` : ''}${club ? ` • ${club}` : ''}`
          })
        });
        console.log(`Slack notification sent for: ${email}`);
      } catch (slackError) {
        console.error("Failed to send Slack notification:", slackError);
        // Don't fail the request if Slack notification fails
      }
    }

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
