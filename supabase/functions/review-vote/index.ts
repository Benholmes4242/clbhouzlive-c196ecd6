import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoteRequest {
  value: 'helpful' | 'unhelpful' | 'none';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from session
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract review ID from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const reviewId = pathParts[pathParts.length - 2] // /review-vote/{reviewId}/vote

    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: 'Review ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { value }: VoteRequest = await req.json()

    console.log(`Processing vote for review ${reviewId} by user ${user.id}: ${value}`)

    // Validate the review exists
    const { data: review, error: reviewError } = await supabaseClient
      .from('course_ratings')
      .select('id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      console.error('Review not found:', reviewError)
      return new Response(
        JSON.stringify({ error: 'Review not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle vote logic
    if (value === 'none') {
      // Delete existing vote
      const { error: deleteError } = await supabaseClient
        .from('review_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting vote:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to remove vote' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Upsert vote (insert or update)
      const voteValue = value === 'helpful' ? 1 : -1
      
      const { error: upsertError } = await supabaseClient
        .from('review_votes')
        .upsert(
          {
            review_id: reviewId,
            user_id: user.id,
            value: voteValue
          },
          {
            onConflict: 'review_id,user_id'
          }
        )

      if (upsertError) {
        console.error('Error upserting vote:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save vote' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Get updated counts and user's vote
    const { data: updatedReview, error: fetchError } = await supabaseClient
      .from('course_ratings')
      .select('helpful_count, unhelpful_count')
      .eq('id', reviewId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated counts:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch updated counts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's current vote
    const { data: userVoteData } = await supabaseClient
      .from('review_votes')
      .select('value')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single()

    const userVote = userVoteData?.value === 1 ? 'helpful' : 
                     userVoteData?.value === -1 ? 'unhelpful' : 'none'

    console.log(`Vote processed successfully. Counts: ${updatedReview.helpful_count}/${updatedReview.unhelpful_count}, User vote: ${userVote}`)

    return new Response(
      JSON.stringify({
        helpfulCount: updatedReview.helpful_count || 0,
        unhelpfulCount: updatedReview.unhelpful_count || 0,
        userVote
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})