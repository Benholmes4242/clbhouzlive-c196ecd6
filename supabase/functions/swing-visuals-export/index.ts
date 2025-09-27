import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const analysisId = url.searchParams.get('analysisId');

    if (!analysisId) {
      return new Response('Missing analysisId parameter', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get visuals for the analysis
    const { data: visuals, error } = await supabase
      .from('swing_visuals')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('frame_index');

    if (error || !visuals || visuals.length === 0) {
      return new Response('No visuals found for analysis', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get analysis info for metadata
    const { data: analysis } = await supabase
      .from('pro_ai_analyses')
      .select('created_at, swing_context')
      .eq('id', analysisId)
      .single();

    // Create ZIP content (simplified - in production would use proper ZIP library)
    const zipContent = await createZipContent(visuals, analysis);

    return new Response(zipContent as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="swing-analysis-${analysisId.slice(0, 8)}.zip"`,
      },
    });

  } catch (error) {
    console.error('Error in export function:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function createZipContent(visuals: any[], analysis: any): Promise<Uint8Array> {
  // This is a placeholder implementation
  // In a real implementation, you would use a proper ZIP library
  // For now, we'll create a simple text file with visual URLs
  
  let content = `SwingCoach Visual Pack\n`;
  content += `======================\n\n`;
  content += `Analysis Date: ${analysis?.created_at || 'Unknown'}\n`;
  content += `Context: ${analysis?.swing_context || 'No context provided'}\n\n`;
  content += `Visual Files:\n`;
  
  visuals.forEach((visual, index) => {
    content += `${index + 1}. ${visual.label}\n`;
    content += `   Frame: ${visual.frame_index}\n`;
    content += `   URL: ${visual.url}\n\n`;
  });
  
  content += `\nTo view these visuals, open each URL in your browser.\n`;
  content += `These images contain annotated feedback from your swing analysis.\n`;

  // Convert to bytes
  return new TextEncoder().encode(content);
}