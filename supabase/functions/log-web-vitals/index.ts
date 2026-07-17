import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsFor } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('web_vitals').insert({
      metric_name: body.name,
      value: body.value,
      rating: body.rating,
      path: body.path,
      recorded_at: new Date(body.ts).toISOString(),
    });

    return new Response('ok', { headers: corsHeaders });
  } catch {
    return new Response('error', { status: 500, headers: corsHeaders });
  }
});
