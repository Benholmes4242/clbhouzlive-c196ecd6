import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'R2 credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin
    const { data: adminMembership } = await supabase
      .from('admin_memberships')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminMembership) {
      throw new Error('Admin access required');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const playerId = formData.get('playerId') as string;
    
    if (!file || !playerId) {
      throw new Error('Missing required parameters: file or playerId');
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop() || 'webp';
    
    // Use consistent path: player-headshots/{playerId}.{ext}
    const fullPath = `player-headshots/${playerId}.${fileExtension}`;

    console.log('📁 Uploading player headshot:', { playerId, fullPath, fileSize: file.size });

    const fileContent = await file.arrayBuffer();

    // Upload to R2 using S3-compatible API
    const uploadUrl = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${fullPath}`;
    
    const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDateTime.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    
    const encoder = new TextEncoder();
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey(
        'raw',
        encoder.encode(`AWS4${key}`),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));
      
      const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName));
      
      const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName));
      
      const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kSigningSig = await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'));
      
      return kSigningSig;
    };

    const contentHash = await crypto.subtle.digest('SHA-256', fileContent);
    const contentHashHex = Array.from(new Uint8Array(contentHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const canonicalUri = `/${r2Bucket}/${fullPath}`;
    const canonicalQueryString = '';
    const canonicalHeaders = `host:${r2AccountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${contentHashHex}\nx-amz-date:${amzDateTime}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;

    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

    const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
    const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign));
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-amz-content-sha256': contentHashHex,
        'x-amz-date': amzDateTime,
        'Authorization': authorizationHeader,
        'Content-Type': file.type || 'image/webp',
      },
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ R2 upload failed:', errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    console.log('✅ R2 upload successful');

    // Construct the public URL
    const publicUrl = `${r2PublicBaseUrl}/${fullPath}`;

    // Update the player's photo_url in the database
    const { error: updateError } = await supabase
      .from('sr_players')
      .update({ photo_url: publicUrl })
      .eq('id', playerId);

    if (updateError) {
      console.error('❌ Failed to update player photo_url:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Player photo_url updated:', { playerId, publicUrl });

    return new Response(JSON.stringify({
      success: true,
      publicUrl,
      playerId,
      fullPath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
