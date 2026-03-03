import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailChangeRequest {
  newEmail: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.log('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { newEmail }: EmailChangeRequest = await req.json();

    // Validate email format (server-side)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's actual current email from admin API — never trust client-provided value
    const { data: { user: adminUser }, error: adminError } = await supabase.auth.admin.getUserById(user.id);

    if (adminError || !adminUser) {
      console.error('Failed to fetch user via admin API:', adminError);
      return new Response(JSON.stringify({ error: 'Failed to verify current email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check new email is different from actual current email
    if (newEmail.toLowerCase() === adminUser.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'New email must be different from your current email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cooldown check
    const { data: canChange, error: cooldownError } = await supabase.rpc('can_change_email', {
      user_id_param: user.id
    });

    if (cooldownError || !canChange) {
      return new Response(JSON.stringify({
        error: 'Email change is in cooldown period. Please wait before changing your email again.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set cooldown (24 hours) — tracks that a change was initiated
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('email_change_count')
      .eq('id', user.id)
      .single();

    const currentCount = currentProfile?.email_change_count || 0;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        email_change_cooldown_until: cooldownUntil.toISOString(),
        email_change_count: currentCount + 1
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile cooldown:', profileError);
    }

    console.log(`Email change validation passed for user ${user.id}. New email: ${newEmail}`);

    // Return success — the client will call supabase.auth.updateUser() to trigger the confirmation email
    return new Response(JSON.stringify({
      success: true,
      message: 'Validation passed. Proceed with email change.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in secure-email-change:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});