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

    console.log(`[delete-account] Processing GDPR-compliant delete for user ${user.id}`)

    // Create admin client with service role for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Generate anonymized values
    const anonymizedUsername = `deleted_user_${user.id.slice(0, 8)}`
    const anonymizedDisplayName = 'Deleted User'
    const deletedAt = new Date().toISOString()

    // Track deletion results for logging
    const deletionResults: Record<string, { deleted: number; error?: string }> = {}

    // ========== CASCADE DELETE USER DATA (GDPR Compliance) ==========

    // 1. Delete user's posts and associated data
    try {
      // First delete post_media, post_comments, post_likes associated with user's posts
      const { data: userPosts } = await adminClient
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
      
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id)
        
        // Delete post likes
        await adminClient.from('post_likes').delete().in('post_id', postIds)
        
        // Delete post comments
        await adminClient.from('post_comments').delete().in('post_id', postIds)
        
        // Delete post media
        await adminClient.from('post_media').delete().in('post_id', postIds)
      }
      
      // Delete posts
      const { count } = await adminClient
        .from('posts')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.posts = { deleted: count || 0 }
    } catch (e) {
      console.error('[delete-account] Error deleting posts:', e)
      deletionResults.posts = { deleted: 0, error: String(e) }
    }

    // 2. Delete user's comments on other posts
    try {
      const { count } = await adminClient
        .from('post_comments')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.comments = { deleted: count || 0 }
    } catch (e) {
      deletionResults.comments = { deleted: 0, error: String(e) }
    }

    // 3. Delete user's post likes
    try {
      const { count } = await adminClient
        .from('post_likes')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.post_likes = { deleted: count || 0 }
    } catch (e) {
      deletionResults.post_likes = { deleted: 0, error: String(e) }
    }

    // 4. Delete comment likes
    try {
      const { count } = await adminClient
        .from('comment_likes')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.comment_likes = { deleted: count || 0 }
    } catch (e) {
      deletionResults.comment_likes = { deleted: 0, error: String(e) }
    }

    // 5. Delete user follows (both directions)
    try {
      const { count: followerCount } = await adminClient
        .from('user_follows')
        .delete({ count: 'exact' })
        .eq('follower_id', user.id)
      const { count: followingCount } = await adminClient
        .from('user_follows')
        .delete({ count: 'exact' })
        .eq('following_id', user.id)
      deletionResults.follows = { deleted: (followerCount || 0) + (followingCount || 0) }
    } catch (e) {
      deletionResults.follows = { deleted: 0, error: String(e) }
    }

    // 6. Delete business follows
    try {
      const { count } = await adminClient
        .from('business_follows')
        .delete({ count: 'exact' })
        .eq('follower_id', user.id)
      deletionResults.business_follows = { deleted: count || 0 }
    } catch (e) {
      deletionResults.business_follows = { deleted: 0, error: String(e) }
    }

    // 7. Delete creator follows
    try {
      const { count } = await adminClient
        .from('creator_follows')
        .delete({ count: 'exact' })
        .eq('follower_id', user.id)
      deletionResults.creator_follows = { deleted: count || 0 }
    } catch (e) {
      deletionResults.creator_follows = { deleted: 0, error: String(e) }
    }

    // 8. Delete blocked users (both directions)
    try {
      const { count: blockerCount } = await adminClient
        .from('user_blocks')
        .delete({ count: 'exact' })
        .eq('blocker_id', user.id)
      const { count: blockedCount } = await adminClient
        .from('user_blocks')
        .delete({ count: 'exact' })
        .eq('blocked_id', user.id)
      deletionResults.blocks = { deleted: (blockerCount || 0) + (blockedCount || 0) }
    } catch (e) {
      deletionResults.blocks = { deleted: 0, error: String(e) }
    }

    // 9. Delete course ratings/reviews
    try {
      // First get rating IDs to delete associated media
      const { data: ratings } = await adminClient
        .from('course_ratings')
        .select('id')
        .eq('user_id', user.id)
      
      if (ratings && ratings.length > 0) {
        const ratingIds = ratings.map(r => r.id)
        await adminClient.from('course_review_media').delete().in('review_id', ratingIds)
        await adminClient.from('course_review_votes').delete().in('rating_id', ratingIds)
        await adminClient.from('course_media').delete().in('rating_id', ratingIds)
      }

      const { count } = await adminClient
        .from('course_ratings')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.reviews = { deleted: count || 0 }
    } catch (e) {
      deletionResults.reviews = { deleted: 0, error: String(e) }
    }

    // 10. Delete course shortlists
    try {
      const { count } = await adminClient
        .from('course_shortlists')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.shortlists = { deleted: count || 0 }
    } catch (e) {
      deletionResults.shortlists = { deleted: 0, error: String(e) }
    }

    // 11. Delete game participations
    try {
      const { count } = await adminClient
        .from('game_participants')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.game_participants = { deleted: count || 0 }
    } catch (e) {
      deletionResults.game_participants = { deleted: 0, error: String(e) }
    }

    // 12. Delete trip participations
    try {
      const { count } = await adminClient
        .from('trip_participants')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.trip_participants = { deleted: count || 0 }
    } catch (e) {
      deletionResults.trip_participants = { deleted: 0, error: String(e) }
    }

    // 13. Delete notification preferences
    try {
      const { count } = await adminClient
        .from('notification_preferences')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.notification_preferences = { deleted: count || 0 }
    } catch (e) {
      deletionResults.notification_preferences = { deleted: 0, error: String(e) }
    }

    // 14. Delete notifications
    try {
      const { count } = await adminClient
        .from('notifications')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.notifications = { deleted: count || 0 }
    } catch (e) {
      deletionResults.notifications = { deleted: 0, error: String(e) }
    }

    // 15. Anonymize support tickets (keep for records)
    try {
      const { count } = await adminClient
        .from('support_tickets')
        .update({ 
          user_id: null,
          context: { anonymized: true, original_user_id: user.id, anonymized_at: deletedAt }
        })
        .eq('user_id', user.id)
      deletionResults.support_tickets = { deleted: count || 0 }
    } catch (e) {
      deletionResults.support_tickets = { deleted: 0, error: String(e) }
    }

    // 16. Delete caddie logs
    try {
      const { count } = await adminClient
        .from('caddie_logs')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.caddie_logs = { deleted: count || 0 }
    } catch (e) {
      deletionResults.caddie_logs = { deleted: 0, error: String(e) }
    }

    // 17. Delete conversation participants and clean up conversations
    try {
      // Remove user from all conversations
      const { count: participantCount } = await adminClient
        .from('conversation_participants')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)

      // Soft-delete conversations created by this user (leave them for other participants)
      const { count: convCount } = await adminClient
        .from('conversations')
        .update({ deleted_at: deletedAt, deleted_by: user.id })
        .eq('created_by', user.id)
        .is('deleted_at', null)
      
      deletionResults.conversations = { deleted: (participantCount || 0) + (convCount || 0) }
    } catch (e) {
      deletionResults.conversations = { deleted: 0, error: String(e) }
    }

    // 17b. Delete friend relationships (both directions, all statuses including pending)
    try {
      const { count: asUser } = await adminClient
        .from('user_friends')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      const { count: asFriend } = await adminClient
        .from('user_friends')
        .delete({ count: 'exact' })
        .eq('friend_id', user.id)
      deletionResults.user_friends = { deleted: (asUser || 0) + (asFriend || 0) }
    } catch (e) {
      deletionResults.user_friends = { deleted: 0, error: String(e) }
    }

    // 17c. Clean up business memberships and deactivate orphaned businesses
    try {
      // Find businesses where user is the sole owner
      const { data: ownedBusinesses } = await adminClient
        .from('business_members')
        .select('business_id, role')
        .eq('user_profile_id', user.id)
        .eq('role', 'owner')

      // Delete all memberships for this user
      const { count: memberCount } = await adminClient
        .from('business_members')
        .delete({ count: 'exact' })
        .eq('user_profile_id', user.id)

      // For each owned business, check if other owners exist — if not, deactivate
      let deactivatedCount = 0
      if (ownedBusinesses && ownedBusinesses.length > 0) {
        for (const biz of ownedBusinesses) {
          const { data: remainingOwners } = await adminClient
            .from('business_members')
            .select('id')
            .eq('business_id', biz.business_id)
            .eq('role', 'owner')
            .limit(1)

          if (!remainingOwners || remainingOwners.length === 0) {
            // No remaining owners — soft-delete the business
            await adminClient
              .from('business_accounts')
              .update({ is_deleted: true, deleted_at: deletedAt })
              .eq('id', biz.business_id)
            deactivatedCount++
          }
        }
      }

      deletionResults.business_memberships = { deleted: (memberCount || 0) }
      if (deactivatedCount > 0) {
        deletionResults.orphaned_businesses_deactivated = { deleted: deactivatedCount }
      }
    } catch (e) {
      console.error('[delete-account] Error cleaning up business memberships:', e)
      deletionResults.business_memberships = { deleted: 0, error: String(e) }
    }

    // 18. Delete user badges
    try {
      const { count } = await adminClient
        .from('user_badges')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.user_badges = { deleted: count || 0 }
    } catch (e) {
      deletionResults.user_badges = { deleted: 0, error: String(e) }
    }

    // 19. Delete user achievements
    try {
      const { count } = await adminClient
        .from('user_achievements')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.user_achievements = { deleted: count || 0 }
    } catch (e) {
      deletionResults.user_achievements = { deleted: 0, error: String(e) }
    }

    // 20. Delete cosmetic loadouts
    try {
      const { count } = await adminClient
        .from('cosmetic_loadouts')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.cosmetic_loadouts = { deleted: count || 0 }
    } catch (e) {
      deletionResults.cosmetic_loadouts = { deleted: 0, error: String(e) }
    }

    // 21. Delete season progress
    try {
      const { count } = await adminClient
        .from('season_progress')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.season_progress = { deleted: count || 0 }
    } catch (e) {
      deletionResults.season_progress = { deleted: 0, error: String(e) }
    }

    // 22. Delete AI caption usage (legacy table - safe to skip if table removed)
    try {
      const { count } = await adminClient
        .from('ai_caption_usage')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      deletionResults.ai_caption_usage = { deleted: count || 0 }
    } catch (e) {
      deletionResults.ai_caption_usage = { deleted: 0, error: String(e) }
    }

    // ========== DELETE MEDIA FROM STORAGE ==========
    try {
      // List and delete user's media from storage buckets
      const buckets = ['avatars', 'covers', 'post-media', 'review-media']
      for (const bucket of buckets) {
        const { data: files } = await adminClient.storage
          .from(bucket)
          .list(user.id)
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${user.id}/${f.name}`)
          await adminClient.storage.from(bucket).remove(filePaths)
          console.log(`[delete-account] Deleted ${files.length} files from ${bucket}`)
        }
      }
      deletionResults.storage = { deleted: 1 }
    } catch (e) {
      console.error('[delete-account] Error deleting storage:', e)
      deletionResults.storage = { deleted: 0, error: String(e) }
    }

    // ========== SOFT DELETE PROFILE (Final Step) ==========
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
        home_course: null,
        handicap: null,
        is_public: false,
        is_creator: false,
        creator_only: false,
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
        action: 'SELF_DELETE_ACCOUNT_GDPR',
        target_user_id: user.id,
        target_email: user.email,
        details: { 
          soft_delete: true, 
          deleted_at: deletedAt,
          deletion_results: deletionResults,
          gdpr_compliant: true
        }
      })

    console.log(`[delete-account] Successfully deleted user ${user.id}`, deletionResults)

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
