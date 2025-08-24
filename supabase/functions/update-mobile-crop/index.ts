import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Update mobile crop function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request data
    const { userId, cropData } = await req.json();
    
    console.log('Updating mobile crop for user:', userId, 'with data:', cropData);

    if (!userId || !cropData) {
      throw new Error('Missing userId or cropData');
    }

    // Update the user profile with mobile crop data
    console.log('About to update user_profiles table for user:', userId);
    console.log('Update data:', {
      mobile_crop_x: cropData.mobile_crop_x,
      mobile_crop_y: cropData.mobile_crop_y,
      mobile_crop_width: cropData.mobile_crop_width,
      mobile_crop_height: cropData.mobile_crop_height,
      updated_at: cropData.updated_at
    });
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        mobile_crop_x: cropData.mobile_crop_x,
        mobile_crop_y: cropData.mobile_crop_y,
        mobile_crop_width: cropData.mobile_crop_width,
        mobile_crop_height: cropData.mobile_crop_height,
        updated_at: cropData.updated_at
      })
      .eq('id', userId);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Update successful, returned data:', data);

    console.log('Mobile crop updated successfully');
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error updating mobile crop:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to update mobile crop',
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});