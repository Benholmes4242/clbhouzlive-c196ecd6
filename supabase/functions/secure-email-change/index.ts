import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailChangeRequest {
  newEmail: string;
  currentEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.log('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { newEmail, currentEmail }: EmailChangeRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can change email (cooldown check)
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

    // Check if new email is already in use
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return new Response(JSON.stringify({ error: 'Failed to validate email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailExists = existingUser.users.some(u => u.email === newEmail && u.id !== user.id);
    if (emailExists) {
      return new Response(JSON.stringify({ error: 'Email address is already in use' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Changing email for user ${user.id} from ${currentEmail} to ${newEmail}`);

    // Update user email using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: newEmail
    });

    if (updateError) {
      console.error('Error updating email:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user profile with cooldown period (24 hours)
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    // First get current email_change_count
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

    console.log(`Successfully changed email for user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email updated successfully',
      cooldownUntil: cooldownUntil.toISOString()
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