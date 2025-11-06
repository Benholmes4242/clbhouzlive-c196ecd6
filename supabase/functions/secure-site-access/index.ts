import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function makeCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const BACKOFF_STEPS = [1, 2, 4, 8, 16]; // seconds
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AccessValidationRequest {
  accessCode: string;
  domain: string;
}

// Base64url helpers
function b64urlToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function bytesToB64url(bytes: Uint8Array) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Verify a hash in the form: pbkdf2$sha256$<iters>$<salt_b64>$<dk_b64>
async function verifyPBKDF2(scheme: string, rawCode: string) {
  try {
    const [alg, hash, iterStr, saltB64, dkB64] = scheme.split('$').slice(1);
    if (alg !== 'sha256' || !iterStr || !saltB64 || !dkB64) return false;

    const iterations = parseInt(iterStr, 10);
    const salt = b64urlToBytes(saltB64);
    const codeKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(rawCode.toUpperCase()),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      codeKey,
      256 // 32 bytes
    );
    const derived = new Uint8Array(bits);
    const derivedB64 = bytesToB64url(derived);
    return crypto.timingSafeEqual
      ? crypto.timingSafeEqual(b64urlToBytes(derivedB64), b64urlToBytes(dkB64))
      : derivedB64 === dkB64; // fallback if timingSafeEqual not present
  } catch {
    return false;
  }
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
  const corsHeaders = makeCorsHeaders(req);
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

    // Fallback plaintext codes for development
    const plaintextCodes = [
      "CLBHOUZ2025*",
      "CLBHOUZ2024",
    ];

    // Verify access code against PBKDF2 hashes or plaintext fallbacks
    let isValid = false;
    
    // Check plaintext codes first (for development/testing)
    if (accessCode && plaintextCodes.some(code => code.toUpperCase() === String(accessCode).toUpperCase())) {
      isValid = true;
    }
    
    // Then check PBKDF2 hashes if configured
    if (!isValid && accessCode && hashes.length) {
      for (const scheme of hashes) {
        if (scheme.startsWith("pbkdf2$sha256$")) {
          if (await verifyPBKDF2(scheme, String(accessCode))) {
            isValid = true;
            break;
          }
        }
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
      `clubhouz_gate=${signedToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_TTL_MS / 1000}`
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