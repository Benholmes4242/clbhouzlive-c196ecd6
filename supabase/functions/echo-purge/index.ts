/**
 * echo-purge - Daily cleanup of Echo conversations older than 30 days
 * 
 * Should be called daily via scheduled job or external scheduler.
 * Uses service role to delete data across all users.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for cross-user operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`[echo-purge] Purging data older than ${cutoffDate}`);

    // Delete old messages first (respects FK cascade anyway, but explicit is clearer)
    const { count: messagesDeleted, error: msgError } = await supabase
      .from('echo_conversation_messages')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id', { count: 'exact', head: true });

    if (msgError) {
      console.error('[echo-purge] Error deleting messages:', msgError);
    }

    // Delete old conversations
    const { count: conversationsDeleted, error: convError } = await supabase
      .from('echo_conversations')
      .delete()
      .lt('last_message_at', cutoffDate)
      .select('id', { count: 'exact', head: true });

    if (convError) {
      console.error('[echo-purge] Error deleting conversations:', convError);
    }

    console.log(`[echo-purge] Complete. Messages: ${messagesDeleted ?? 0}, Conversations: ${conversationsDeleted ?? 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        purged: {
          messages: messagesDeleted ?? 0,
          conversations: conversationsDeleted ?? 0,
        },
        cutoffDate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[echo-purge] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
