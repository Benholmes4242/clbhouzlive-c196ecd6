// JWT token utilities using native Web Crypto API

export type GateClaims = {
  sub: string; // user id or fingerprint
  role: 'admin' | 'member';
  iat: number;
  exp: number;
};

// Base64url encoding/decoding
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// Sign JWT token
export async function signGateToken(
  sub: string,
  role: GateClaims['role'],
  ttlSeconds: number
): Promise<string> {
  const SECRET = Deno.env.get('SITE_ACCESS_SIGNING_KEY');
  if (!SECRET) throw new Error('SITE_ACCESS_SIGNING_KEY not configured');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: GateClaims = {
    sub,
    role,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${message}.${encodedSignature}`;
}

// Verify JWT token with clock skew tolerance
export async function verifyGateToken(
  token: string,
  skewSeconds = 60
): Promise<GateClaims> {
  const SECRET = Deno.env.get('SITE_ACCESS_SIGNING_KEY');
  if (!SECRET) throw new Error('SITE_ACCESS_SIGNING_KEY not configured');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('INVALID_TOKEN');

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const message = `${encodedHeader}.${encodedPayload}`;

  // Verify signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64urlDecode(encodedSignature),
    new TextEncoder().encode(message)
  );

  if (!signatureValid) throw new Error('INVALID_TOKEN');

  // Decode and validate claims
  const payload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(encodedPayload))
  ) as GateClaims;

  const now = Math.floor(Date.now() / 1000);
  
  // Check expiry with skew tolerance
  if (payload.exp <= now - skewSeconds) {
    throw new Error('TOKEN_EXPIRED');
  }

  // Check issued-at not too far in future (clock skew)
  if (payload.iat > now + skewSeconds) {
    throw new Error('INVALID_TOKEN');
  }

  return payload;
}
