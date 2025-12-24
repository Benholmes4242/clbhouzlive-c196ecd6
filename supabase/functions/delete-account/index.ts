import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[delete-account] No authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a client with the user's JWT to get their user ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('[delete-account] Failed to get user:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[delete-account] Processing soft delete for user ${user.id}`)

    // Create admin client with service role for the soft delete operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Generate anonymized values
    const anonymizedUsername = `deleted_user_${user.id.slice(0, 8)}`
    const anonymizedDisplayName = 'Deleted User'
    const deletedAt = new Date().toISOString()

    // Perform soft delete: set deleted_at, anonymize display_name and username
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        deleted_at: deletedAt,
        display_name: anonymizedDisplayName,
        username: anonymizedUsername,
        bio: null,
        avatar_url: null,
        cover_image_url: null,
        phone: null,
        // Keep ID and user_id for referential integrity
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[delete-account] Failed to soft delete profile:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the deletion in admin_audit_log
    await adminClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action: 'SELF_DELETE_ACCOUNT',
        target_user_id: user.id,
        target_email: user.email,
        details: { soft_delete: true, deleted_at: deletedAt }
      })

    console.log(`[delete-account] Successfully soft deleted user ${user.id}`)

    // Sign out the user
    await userClient.auth.signOut()

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[delete-account] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
