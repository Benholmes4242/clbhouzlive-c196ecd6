import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting golfer eligibility signals computation...')

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, avatar_url, bio, home_club, handicap, website, instagram, twitter, tiktok, youtube, is_verified_golfer')
      .eq('profile_type', 'personal')
      .eq('is_verified_golfer', false)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log(`Processing ${profiles?.length || 0} profiles`)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Fetch followers counts
    const { data: followsCounts, error: followsError } = await supabase
      .from('follows')
      .select('following_profile_id')
    
    const followersMap = new Map<string, number>()
    if (!followsError && followsCounts) {
      for (const f of followsCounts) {
        const count = followersMap.get(f.following_profile_id) || 0
        followersMap.set(f.following_profile_id, count + 1)
      }
    }

    // Fetch course ratings for Top 100 activity
    const { data: ratings, error: ratingsError } = await supabase
      .from('course_ratings')
      .select('user_id, course_id, created_at')
      .gte('created_at', thirtyDaysAgoISO)

    const courseTagsMap = new Map<string, number>()
    if (!ratingsError && ratings) {
      for (const r of ratings) {
        if (r.user_id) {
          const count = courseTagsMap.get(r.user_id) || 0
          courseTagsMap.set(r.user_id, count + 1)
        }
      }
    }

    // Get Top 100 course IDs
    const { data: top100Memberships, error: top100Error } = await supabase
      .from('course_top100_memberships')
      .select('course_id')

    const top100CourseIds = new Set(top100Memberships?.map(m => m.course_id) || [])

    // Calculate Top 100 course tags per user
    const top100TagsMap = new Map<string, number>()
    if (!ratingsError && ratings) {
      for (const r of ratings) {
        if (r.user_id && top100CourseIds.has(r.course_id)) {
          const count = top100TagsMap.get(r.user_id) || 0
          top100TagsMap.set(r.user_id, count + 1)
        }
      }
    }

    // Process each profile and compute signals
    const signalsToUpsert = []

    for (const profile of profiles || []) {
      // Profile completeness (0-100)
      let completeness = 0
      if (profile.avatar_url) completeness += 20
      if (profile.display_name) completeness += 15
      if (profile.bio && profile.bio.length > 10) completeness += 20
      if (profile.home_club) completeness += 15
      if (profile.handicap !== null) completeness += 10
      if (profile.website || profile.instagram || profile.twitter || profile.tiktok || profile.youtube) completeness += 20

      // Has external links
      const hasExternalLinks = !!(profile.website || profile.instagram || profile.twitter || profile.tiktok || profile.youtube)

      // Get counts
      const followersCount = followersMap.get(profile.id) || 0
      const courseTagsCount = courseTagsMap.get(profile.id) || 0
      const top100TagsCount = top100TagsMap.get(profile.id) || 0

      // Mentions - we don't have a mentions table, so default to 0
      const mentions30d = 0
      const uniqueMentioners30d = 0

      // Simple engagement score
      const engagementScore = Math.min(100, followersCount * 2 + courseTagsCount * 5 + top100TagsCount * 10)

      // Determine candidate state
      let candidateState = 'monitor'
      
      // High confidence if: top100 tags >= 3 OR unique mentioners >= 5
      if (top100TagsCount >= 3 || uniqueMentioners30d >= 5) {
        candidateState = 'high_confidence_candidate'
      }
      // Notable if: mentions >= 3 OR has external links OR course tags >= 5
      else if (mentions30d >= 3 || hasExternalLinks || courseTagsCount >= 5) {
        candidateState = 'notable_candidate'
      }

      signalsToUpsert.push({
        user_id: profile.id,
        profile_completeness_score: completeness,
        has_external_links: hasExternalLinks,
        mentions_30d: mentions30d,
        unique_mentioners_30d: uniqueMentioners30d,
        course_tags_30d: courseTagsCount,
        top100_course_tags_30d: top100TagsCount,
        followers_count: followersCount,
        engagement_score_30d: engagementScore,
        candidate_state: candidateState,
        last_computed_at: new Date().toISOString(),
      })
    }

    // Upsert in batches of 100
    const batchSize = 100
    let upsertedCount = 0

    for (let i = 0; i < signalsToUpsert.length; i += batchSize) {
      const batch = signalsToUpsert.slice(i, i + batchSize)
      const { error: upsertError } = await supabase
        .from('golfer_eligibility_signals')
        .upsert(batch, { onConflict: 'user_id' })

      if (upsertError) {
        console.error(`Error upserting batch ${i / batchSize}:`, upsertError)
      } else {
        upsertedCount += batch.length
      }
    }

    console.log(`Computation complete. Upserted ${upsertedCount} signals.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: profiles?.length || 0,
        upserted: upsertedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in compute-golfer-eligibility-signals:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
