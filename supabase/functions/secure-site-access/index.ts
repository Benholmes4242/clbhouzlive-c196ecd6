import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify as argon2Verify } from "https://deno.land/x/argon2@v0.9.0/lib/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BACKOFF_STEPS = [1, 2, 4, 8, 16]; // seconds
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AccessValidationRequest {
  accessCode: string;
  domain: string;
}

// Simple HMAC signing for session tokens
async function signToken(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessCode, domain }: AccessValidationRequest = await req.json();

    // Get client IP for rate limiting
    const clientIP = req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    
    console.log(`Secure site access attempt from IP: ${clientIP}, domain: ${domain}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing attempts and apply progressive backoff
    const { data: attemptRow } = await supabase
      .from("site_gate_attempts")
      .select("*")
      .eq("ip", clientIP)
      .maybeSingle();

    // Get hashed access codes from environment
    const hashes = [
      Deno.env.get("SITE_ACCESS_CODE_PRIMARY_HASH"),
    ].filter(Boolean) as string[];

    if (!hashes.length) {
      console.error("No access code hashes configured");
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

    // Verify access code against Argon2 hashes
    let isValid = false;
    if (accessCode) {
      try {
        const normalizedCode = String(accessCode).toUpperCase();
        // Try to verify against each hash
        for (const hash of hashes) {
          try {
            if (await argon2Verify(hash, normalizedCode)) {
              isValid = true;
              break;
            }
          } catch (e) {
            // Hash verification failed, try next
            continue;
          }
        }
      } catch (e) {
        console.error("Error verifying code:", e);
      }
    }

    if (!isValid) {
      // Increment failure count
      const failCount = (attemptRow?.fail_count ?? 0) + 1;
      const backoffSeconds = BACKOFF_STEPS[Math.min(failCount - 1, BACKOFF_STEPS.length - 1)];

      await supabase
        .from("site_gate_attempts")
        .upsert({ 
          ip: clientIP, 
          fail_count: failCount, 
          last_failed_at: new Date().toISOString() 
        });

      console.warn(`Failed access attempt - IP: ${clientIP}, failures: ${failCount}`);

      // Apply backoff delay
      await new Promise(resolve => setTimeout(resolve, backoffSeconds * 1000));

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

    // Success - reset attempts
    await supabase
      .from("site_gate_attempts")
      .delete()
      .eq("ip", clientIP);

    console.log(`Valid access granted - IP: ${clientIP}, domain: ${domain}`);

    // Create signed session token
    const sessionPayload = {
      jti: crypto.randomUUID(),
      exp: Date.now() + SESSION_TTL_MS,
      dom: domain ?? null,
    };

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "CLUBHOUZ" }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const payload = btoa(JSON.stringify(sessionPayload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signingKey = Deno.env.get("SITE_ACCESS_SIGNING_KEY")!;
    const signature = await signToken(`${header}.${payload}`, signingKey);
    const signedToken = `${header}.${payload}.${signature}`;

    // Set HttpOnly cookie
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append(
      "Set-Cookie",
      `clubhouz_gate=${signedToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });

    return new Response(
      JSON.stringify({ success: true, message: "Access granted" }),
      { status: 200, headers }
    );

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