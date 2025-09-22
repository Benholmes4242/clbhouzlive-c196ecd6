import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shareId, accessToken, reviewUrl } = await req.json();

    if (!shareId || !accessToken) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get share details
    const { data: shareData, error: shareError } = await supabase
      .from('swing_shares')
      .select(`
        *,
        coach_profiles(*),
        pro_ai_analyses(*)
      `)
      .eq('id', shareId)
      .single();

    if (shareError || !shareData) {
      console.error('Error fetching share data:', shareError);
      return new Response(JSON.stringify({ error: 'Share not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for sender name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', shareData.user_id)
      .single();

    const senderName = userProfile?.display_name || userProfile?.username || 'A golfer';
    const coachName = shareData.coach_profiles.name;
    const coachEmail = shareData.coach_profiles.email;

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: 'SwingCoach <coaching@clbhouz.co.uk>',
      to: [coachEmail],
      subject: `New Swing Review Request from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2A9D8F; margin-bottom: 20px;">New Swing Review Request</h1>
          
          <p>Hi ${coachName},</p>
          
          <p>You have received a new swing analysis review request from <strong>${senderName}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">What's included:</h3>
            <ul style="margin: 10px 0;">
              ${shareData.consent_flags.shareVideo ? '<li>✅ Swing video</li>' : ''}
              ${shareData.consent_flags.shareVisuals ? '<li>✅ Visual analysis images</li>' : ''}
              ${shareData.consent_flags.shareAnalysis ? '<li>✅ AI analysis text</li>' : ''}
              ${shareData.consent_flags.shareContact ? '<li>✅ Contact information</li>' : '<li>❌ Contact information (not shared)</li>'}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" 
               style="background-color: #2A9D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Review Swing Analysis
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This review link expires in 7 days. The golfer will be notified when you provide your feedback.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            This email was sent by SwingCoach. If you received this in error, please ignore this message.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      throw emailResponse.error;
    }

    // Update share status
    await supabase
      .from('swing_shares')
      .update({ status: 'sent' })
      .eq('id', shareId);

    console.log('Coach notification sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in coach notification function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});