// Stream Video Backup Function
// Backs up Cloudflare Stream videos to R2 and AWS S3 daily

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StreamVideo {
  uid: string;
  status: { state: string };
  meta?: { name?: string };
  created?: string;
}

interface BackupIndex {
  backedUpVideos: string[];
  lastBackup: string;
}

// AWS SigV4 signing helper
async function signAwsRequest(
  method: string,
  url: string,
  region: string,
  service: string,
  accessKeyId: string,
  secretAccessKey: string,
  body?: Uint8Array
): Promise<Headers> {
  const encoder = new TextEncoder();
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname;
  
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-date';
  
  const payloadHash = body 
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  const getSignatureKey = async (key: string, dateStamp: string, region: string, service: string) => {
    const kDate = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', encoder.encode(`AWS4${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(dateStamp)
    );
    const kRegion = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', kDate, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(region)
    );
    const kService = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', kRegion, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(service)
    );
    const kSigning = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', kService, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode('aws4_request')
    );
    return kSigning;
  };
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode(stringToSign)
      )
    )
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const headers = new Headers();
  headers.set('Host', host);
  headers.set('X-Amz-Date', amzDate);
  headers.set('Authorization', authHeader);
  if (body) {
    headers.set('Content-Length', body.length.toString());
  }
  
  return headers;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎬 Starting Stream backup job');

    // Get environment variables
    const streamAccountId = Deno.env.get('STREAM_ACCOUNT_ID');
    const streamApiToken = Deno.env.get('STREAM_API_TOKEN');
    const streamDownloadBase = Deno.env.get('STREAM_DOWNLOAD_BASE');
    const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsRegion = Deno.env.get('AWS_REGION') || 'eu-north-1';
    const awsS3Bucket = Deno.env.get('AWS_S3_BACKUP_BUCKET') || 'clbhouz-dr-backup';

    // Validate required env vars
    if (!streamAccountId || !streamApiToken || !streamDownloadBase) {
      throw new Error('Missing Stream credentials');
    }
    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error('Missing R2 credentials');
    }
    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('Missing AWS credentials');
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
    const r2Bucket = 'clbhouz-stream-backups';

    // Step 1: Fetch backup index from R2
    console.log('📋 Fetching backup index from R2...');
    let backupIndex: BackupIndex = { backedUpVideos: [], lastBackup: '' };
    
    try {
      const indexUrl = `${r2Endpoint}/${r2Bucket}/backups/index.json`;
      const indexHeaders = await signAwsRequest('GET', indexUrl, 'auto', 's3', r2AccessKeyId, r2SecretAccessKey);
      const indexRes = await fetch(indexUrl, { headers: indexHeaders });
      
      if (indexRes.ok) {
        backupIndex = await indexRes.json();
        console.log(`✅ Found ${backupIndex.backedUpVideos.length} already backed up videos`);
      } else {
        console.log('📝 No existing index found, starting fresh');
      }
    } catch (error) {
      console.log('📝 Could not load index, starting fresh:', error);
    }

    // Step 2: List videos from Stream API
    console.log('🎥 Fetching videos from Cloudflare Stream...');
    const streamListUrl = `https://api.cloudflare.com/client/v4/accounts/${streamAccountId}/stream`;
    const streamRes = await fetch(streamListUrl, {
      headers: {
        'Authorization': `Bearer ${streamApiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!streamRes.ok) {
      throw new Error(`Stream API error: ${streamRes.status} ${await streamRes.text()}`);
    }

    const streamData = await streamRes.json();
    const allVideos: StreamVideo[] = streamData.result || [];
    console.log(`📊 Found ${allVideos.length} total videos`);

    // Step 3: Filter out already backed up videos
    const videosToBackup = allVideos.filter(v => 
      v.status.state === 'ready' && !backupIndex.backedUpVideos.includes(v.uid)
    );
    console.log(`🆕 ${videosToBackup.length} new videos to back up`);

    let backedUpCount = 0;
    let skippedCount = allVideos.length - videosToBackup.length;
    const errors: string[] = [];

    // Step 4: Back up each video
    for (const video of videosToBackup) {
      try {
        console.log(`\n⬇️ Backing up video: ${video.uid}`);

        // Download video from Stream
        const downloadUrl = `${streamDownloadBase}/${video.uid}/downloads/default.mp4`;
        console.log(`   Downloading from: ${downloadUrl}`);
        
        const videoRes = await fetch(downloadUrl);
        if (!videoRes.ok) {
          throw new Error(`Download failed: ${videoRes.status}`);
        }

        const videoData = new Uint8Array(await videoRes.arrayBuffer());
        const videoSizeMB = (videoData.length / 1024 / 1024).toFixed(2);
        console.log(`   Downloaded: ${videoSizeMB} MB`);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const videoKey = `videos/${video.uid}/${timestamp}.mp4`;

        // Upload to R2
        console.log(`   📤 Uploading to R2...`);
        const r2UploadUrl = `${r2Endpoint}/${r2Bucket}/${videoKey}`;
        const r2Headers = await signAwsRequest('PUT', r2UploadUrl, 'auto', 's3', r2AccessKeyId, r2SecretAccessKey, videoData);
        r2Headers.set('Content-Type', 'video/mp4');
        
        const r2UploadRes = await fetch(r2UploadUrl, {
          method: 'PUT',
          headers: r2Headers,
          body: videoData,
        });

        if (!r2UploadRes.ok) {
          throw new Error(`R2 upload failed: ${r2UploadRes.status} ${await r2UploadRes.text()}`);
        }
        console.log(`   ✅ R2 backup complete`);

        // Upload to S3
        console.log(`   📤 Uploading to AWS S3...`);
        const s3Key = `clbhouz/stream/${videoKey}`;
        const s3UploadUrl = `https://${awsS3Bucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;
        const s3Headers = await signAwsRequest('PUT', s3UploadUrl, awsRegion, 's3', awsAccessKeyId, awsSecretAccessKey, videoData);
        s3Headers.set('Content-Type', 'video/mp4');
        
        const s3UploadRes = await fetch(s3UploadUrl, {
          method: 'PUT',
          headers: s3Headers,
          body: videoData,
        });

        if (!s3UploadRes.ok) {
          throw new Error(`S3 upload failed: ${s3UploadRes.status} ${await s3UploadRes.text()}`);
        }
        console.log(`   ✅ S3 backup complete`);

        // Update index
        backupIndex.backedUpVideos.push(video.uid);
        backedUpCount++;

      } catch (error) {
        const errorMsg = `Failed to back up ${video.uid}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Step 5: Save updated index back to R2
    if (backedUpCount > 0) {
      console.log('\n💾 Updating backup index...');
      backupIndex.lastBackup = new Date().toISOString();
      
      const indexData = new TextEncoder().encode(JSON.stringify(backupIndex, null, 2));
      const indexUrl = `${r2Endpoint}/${r2Bucket}/backups/index.json`;
      const indexHeaders = await signAwsRequest('PUT', indexUrl, 'auto', 's3', r2AccessKeyId, r2SecretAccessKey, indexData);
      indexHeaders.set('Content-Type', 'application/json');
      
      const indexUploadRes = await fetch(indexUrl, {
        method: 'PUT',
        headers: indexHeaders,
        body: indexData,
      });

      if (!indexUploadRes.ok) {
        console.error('⚠️ Failed to update index:', await indexUploadRes.text());
      } else {
        console.log('✅ Index updated');
      }
    }

    // Summary
    const summary = {
      success: true,
      totalVideos: allVideos.length,
      backedUp: backedUpCount,
      skipped: skippedCount,
      errors: errors.length,
      errorMessages: errors,
      timestamp: new Date().toISOString(),
    };

    console.log('\n📊 Backup Summary:');
    console.log(`   Total videos: ${summary.totalVideos}`);
    console.log(`   Backed up: ${summary.backedUp}`);
    console.log(`   Skipped (already backed up): ${summary.skipped}`);
    console.log(`   Errors: ${summary.errors}`);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Backup job failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
