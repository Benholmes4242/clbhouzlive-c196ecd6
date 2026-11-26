import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleProxy } from './handler.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

Deno.serve((req) => handleProxy(req, {
  fetchImpl: fetch,
  lookupThumbnail: async (courseId) => {
    const { data, error } = await admin.from('golf_courses').select('thumbnail_image').eq('id', courseId).maybeSingle();
    if (error) throw error;
    return (data?.thumbnail_image as string | null | undefined) ?? null;
  },
}));
