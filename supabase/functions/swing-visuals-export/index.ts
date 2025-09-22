import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    );

    const url = new URL(req.url);
    const analysisId = url.searchParams.get('analysisId');

    if (!analysisId) {
      return new Response(JSON.stringify({ error: 'Missing analysisId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get swing visuals
    const { data: visuals, error } = await supabaseClient
      .from('swing_visuals')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('phase');

    if (error) {
      console.error('Error fetching visuals:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch visuals' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!visuals || visuals.length === 0) {
      return new Response(JSON.stringify({ error: 'No visuals found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Phase mapping for proper ordering and filename format
    const phaseMap: Record<string, { order: number; code: string }> = {
      'setup': { order: 1, code: 'P1' },
      'takeaway': { order: 2, code: 'P3' },
      'backswing': { order: 3, code: 'P4' },
      'top': { order: 4, code: 'P5' },
      'downswing': { order: 5, code: 'P6' },
      'impact': { order: 6, code: 'P7' },
      'followThrough': { order: 7, code: 'P9' }
    };

    // Sort visuals by phase order
    const sortedVisuals = visuals
      .filter(v => phaseMap[v.phase])
      .sort((a, b) => phaseMap[a.phase].order - phaseMap[b.phase].order);

    // Create ZIP content
    const zipFiles: Array<{ name: string; content: Uint8Array }> = [];
    let readmeContent = '';

    // Download and add each image with proper naming
    for (const visual of sortedVisuals) {
      try {
        const phaseInfo = phaseMap[visual.phase];
        const phaseName = visual.phase.charAt(0).toUpperCase() + visual.phase.slice(1);
        const filename = `${phaseInfo.order.toString().padStart(2, '0')}_${phaseInfo.code}_${phaseName}.png`;
        
        // Download image
        const imageResponse = await fetch(visual.image_url);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          zipFiles.push({
            name: filename,
            content: new Uint8Array(imageBuffer)
          });

          // Add to readme - one line per image: caption + 1 tip
          const primaryTip = visual.tips && visual.tips.length > 0 ? visual.tips[0] : 'Continue working on your swing technique.';
          readmeContent += `${filename}: ${visual.caption} - ${primaryTip}\n`;
        }
      } catch (error) {
        console.error(`Error processing visual ${visual.id}:`, error);
      }
    }

    // Add readme.txt
    if (readmeContent) {
      zipFiles.push({
        name: 'readme.txt',
        content: new TextEncoder().encode(readmeContent)
      });
    }

    // Create simple ZIP format
    const zipBuffer = await createSimpleZip(zipFiles);
    
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `Echo_Visuals_${today}.zip`;

    return new Response(zipBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple ZIP creation function (basic implementation)
async function createSimpleZip(files: Array<{ name: string; content: Uint8Array }>): Promise<Uint8Array> {
  // For simplicity, we'll concatenate files with basic ZIP headers
  // This is a minimal implementation - production should use proper ZIP library
  
  const centralDir: Uint8Array[] = [];
  const fileData: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    // Local file header (30 bytes + filename)
    const nameBytes = new TextEncoder().encode(file.name);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed
    view.setUint16(6, 0, true); // General purpose flag
    view.setUint16(8, 0, true); // Compression method (store)
    view.setUint16(10, 0, true); // Last mod time
    view.setUint16(12, 0, true); // Last mod date
    view.setUint32(14, 0, true); // CRC-32 (simplified)
    view.setUint32(18, file.content.length, true); // Compressed size
    view.setUint32(22, file.content.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // Filename length
    view.setUint16(28, 0, true); // Extra field length
    
    localHeader.set(nameBytes, 30);
    
    fileData.push(localHeader, file.content);
    
    // Central directory entry
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralEntry.buffer);
    
    centralView.setUint32(0, 0x02014b50, true); // Central dir signature
    centralView.setUint16(4, 20, true); // Version made by
    centralView.setUint16(6, 20, true); // Version needed
    centralView.setUint16(8, 0, true); // General purpose flag
    centralView.setUint16(10, 0, true); // Compression method
    centralView.setUint16(12, 0, true); // Last mod time
    centralView.setUint16(14, 0, true); // Last mod date
    centralView.setUint32(16, 0, true); // CRC-32
    centralView.setUint32(20, file.content.length, true); // Compressed size
    centralView.setUint32(24, file.content.length, true); // Uncompressed size
    centralView.setUint16(28, nameBytes.length, true); // Filename length
    centralView.setUint16(30, 0, true); // Extra field length
    centralView.setUint16(32, 0, true); // File comment length
    centralView.setUint16(34, 0, true); // Disk number
    centralView.setUint16(36, 0, true); // Internal file attributes
    centralView.setUint32(38, 0, true); // External file attributes
    centralView.setUint32(42, offset, true); // Relative offset
    
    centralEntry.set(nameBytes, 46);
    centralDir.push(centralEntry);
    
    offset += localHeader.length + file.content.length;
  }
  
  // End of central directory
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  const centralDirSize = centralDir.reduce((sum, entry) => sum + entry.length, 0);
  
  endView.setUint32(0, 0x06054b50, true); // End signature
  endView.setUint16(4, 0, true); // Disk number
  endView.setUint16(6, 0, true); // Central dir disk
  endView.setUint16(8, files.length, true); // Entries on disk
  endView.setUint16(10, files.length, true); // Total entries
  endView.setUint32(12, centralDirSize, true); // Central dir size
  endView.setUint32(16, offset, true); // Central dir offset
  endView.setUint16(20, 0, true); // Comment length
  
  // Combine everything
  const totalSize = fileData.reduce((sum, data) => sum + data.length, 0) + centralDirSize + endRecord.length;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  
  // File data
  for (const data of fileData) {
    result.set(data, pos);
    pos += data.length;
  }
  
  // Central directory
  for (const entry of centralDir) {
    result.set(entry, pos);
    pos += entry.length;
  }
  
  // End record
  result.set(endRecord, pos);
  
  return result;
}