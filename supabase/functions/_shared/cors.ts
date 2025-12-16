// Default CORS headers for edge functions that don't need dynamic origin
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-supabase-api-version',
    'x-supabase-auth'
  ].join(', '),
  'Access-Control-Max-Age': '86400',
};

// Dynamic CORS function for origin-specific responses
export function cors(origin: string | null | undefined) {
  const allow =
    origin &&
    (origin.endsWith('.lovable.app') ||
     origin.endsWith('.lovableproject.com') ||
     origin.includes('clbhouz.co.uk'))
      ? origin
      : 'https://clbhouz.co.uk';

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': [
      'authorization',
      'x-client-info',
      'apikey',
      'content-type',
      'x-supabase-api-version',
      'x-supabase-auth'
    ].join(', '),
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
