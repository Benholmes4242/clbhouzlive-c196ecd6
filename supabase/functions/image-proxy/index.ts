import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://ybxkehyomcakqjvuhnna.supabase.co';
const SUPABASE_SERVICE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE') ??
  '';

const SPORTRADAR_GETTY_KEY =
  Deno.env.get('SPORTRADAR_GETTY_IMAGES_API_KEY') ??
  Deno.env.get('SPORTRADAR_IMAGES_GETTY_KEY') ??
  Deno.env.get('SPORTRADAR_IMAGES_GETTY_KEY') ??
  '';

const BUCKET = 'player-headshots';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB safety cap

function buildFallbackSvg(initials = '?'): Uint8Array {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#E2E8F0"/>
      <stop offset="1" stop-color="#CBD5E1"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#g)"/>
  <circle cx="128" cy="104" r="40" fill="#94A3B8" opacity="0.55"/>
  <path d="M64 220c10-44 44-68 64-68s54 24 64 68" fill="#94A3B8" opacity="0.55"/>
  <text x="128" y="142" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="40" font-weight="700" fill="#64748B" opacity="0.55">${initials}</text>
</svg>`;
  return new TextEncoder().encode(svg);
}

function safeInitialsFromUrl(urlStr: string): string {
  // If we can’t infer anything, return “?”
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    const maybeUuid = parts.find((p) => /^[0-9a-fA-F-]{16,}$/.test(p));
    if (maybeUuid) return 'SR';
  } catch {
    // ignore
  }
  return '?';
}

function isAllowedRemoteUrl(remote: URL): boolean {
  // Prevent SSRF: only allow SportRadar
  return remote.hostname === 'api.sportradar.com';
}

function extFromContentType(ct: string | null): string {
  const t = (ct ?? '').toLowerCase();
  if (t.includes('image/png')) return '.png';
  if (t.includes('image/webp')) return '.webp';
  if (t.includes('image/svg')) return '.svg';
  return '.jpg';
}

function extFromPath(pathname: string): string {
  const m = pathname.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif|svg)$/);
  if (!m) return '';
  if (m[1] === 'jpeg') return '.jpg';
  return `.${m[1]}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function extractStableKey(remote: URL): string | null {
  // Typical headshot URL:
  // /golf-images-t3/getty/pga/headshots/players/{assetOrPlayerUuid}/{file}
  const parts = remote.pathname.split('/').filter(Boolean);
  const playersIdx = parts.findIndex((p) => p === 'players');
  const id = playersIdx >= 0 ? parts[playersIdx + 1] : null;
  if (id && /^[0-9a-fA-F-]{16,}$/.test(id)) return id;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const requestUrl = new URL(req.url);
  const raw = requestUrl.searchParams.get('url');
  if (!raw) {
    return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
  }

  let remote: URL;
  try {
    remote = new URL(raw);
  } catch {
    return new Response('Invalid url parameter', { status: 400, headers: corsHeaders });
  }

  if (!isAllowedRemoteUrl(remote)) {
    return new Response('URL host not allowed', { status: 400, headers: corsHeaders });
  }

  // Ensure API key param exists for SportRadar URLs (many stored URLs include it already)
  if (!remote.searchParams.get('api_key') && SPORTRADAR_GETTY_KEY) {
    remote.searchParams.set('api_key', SPORTRADAR_GETTY_KEY);
  }

  const stableKey = extractStableKey(remote) ?? (await sha256Hex(remote.toString())).slice(0, 24);
  const ext = extFromPath(remote.pathname);
  const objectPath = `sr/${stableKey}${ext || '.jpg'}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;

  // 1) Cache-first: if we already have it in Storage, serve that
  try {
    const cached = await fetch(publicUrl, { headers: { Accept: 'image/*' } });
    if (cached.ok) {
      const bytes = await cached.arrayBuffer();
      const ct = cached.headers.get('Content-Type') || 'image/jpeg';
      return new Response(bytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=604800, immutable',
          'X-Proxy-Cache': 'HIT',
        },
      });
    }
  } catch {
    // If Storage fetch fails, continue to remote
  }

  // 2) Cache miss: fetch from SportRadar
  try {
    console.log(`[Cache MISS] ${stableKey}, fetching from SportRadar...`);
    console.log(`[Proxy] Requested: ${remote.toString().substring(0, 180)}...`);

    const upstream = await fetch(remote.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Clbhouz/1.0',
        Accept: 'image/*',
      },
    });

    if (!upstream.ok) {
      console.error(`[Proxy ERROR] SportRadar returned ${upstream.status} for ${stableKey}`);
      const initials = safeInitialsFromUrl(raw);
      const fallback = buildFallbackSvg(initials);
      return new Response(fallback, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
          'X-Proxy-Cache': 'MISS',
          'X-Proxy-Status': `upstream_${upstream.status}`,
        },
      });
    }

    const contentType = upstream.headers.get('Content-Type') || 'image/jpeg';
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      console.warn(`[Proxy] Refusing to cache large image (${bytes.byteLength} bytes) for ${stableKey}`);
    } else if (SUPABASE_SERVICE_KEY) {
      // Best-effort upload to Storage
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const pathWithExt = objectPath.replace(/\.[a-z0-9]+$/i, ext || extFromContentType(contentType));
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(pathWithExt, new Uint8Array(bytes), {
          upsert: true,
          contentType,
        });

      if (error) {
        console.error(`[Proxy] Storage upload failed for ${stableKey}:`, error);
      } else {
        console.log(`[Cache WRITE] ${pathWithExt}`);
      }
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Proxy-Cache': 'MISS',
        'X-Proxy-Status': 'success',
      },
    });
  } catch (error) {
    console.error('[Proxy error]:', error);
    const fallback = buildFallbackSvg('?');
    return new Response(fallback, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
        'X-Proxy-Cache': 'MISS',
        'X-Proxy-Status': 'error',
      },
    });
  }
});
