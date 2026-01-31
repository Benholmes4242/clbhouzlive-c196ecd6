import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETTY_API_KEY = Deno.env.get('SPORTRADAR_GETTY_IMAGES_API_KEY');
const ACCESS_LEVEL = 't'; // 't' for trial, 'p' for production
const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Storage bucket for permanent headshot storage
const HEADSHOTS_BUCKET = 'player-headshots';

interface ManifestAsset {
  id: string;
  player_id?: string;
  title: string;
  created: string;
  updated: string;
  copyright: string;
  links: Array<{
    width: number;
    height: number;
    href: string;
  }>;
  refs: Array<{
    name: string;
    type: string;
    sport: string;
    sportradar_id: string;
    primary?: boolean;
  }>;
}

interface ManifestResponse {
  provider: string;
  league: string;
  type: string;
  manifest_date: string;
  trial?: boolean;
  assetlist: ManifestAsset[];
}

/**
 * Download an image from SportRadar and upload to Supabase Storage
 * Returns the public URL of the stored image, or null on failure
 */
async function downloadAndStoreImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  playerId: string,
  playerName: string
): Promise<string | null> {
  try {
    console.log(`[Download] Fetching image for ${playerName}...`);
    
    const response = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Clbhouz/1.0',
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[Rate Limited] SportRadar returned 429 for ${playerName}`);
        return null;
      }
      console.error(`[Download Failed] ${response.status} for ${playerName}`);
      return null;
    }
    
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // Determine file extension from content type
    const ext = contentType.includes('png') ? 'png' 
              : contentType.includes('webp') ? 'webp' 
              : 'jpg';
    
    const storagePath = `players/${playerId}.${ext}`;
    
    console.log(`[Upload] Storing ${storagePath} (${imageData.byteLength} bytes)...`);
    
    const { error: uploadError } = await supabase.storage
      .from(HEADSHOTS_BUCKET)
      .upload(storagePath, imageData, {
        contentType,
        upsert: true, // Overwrite if exists
      });
    
    if (uploadError) {
      console.error(`[Upload Failed] ${playerName}: ${uploadError.message}`);
      return null;
    }
    
    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${HEADSHOTS_BUCKET}/${storagePath}`;
    console.log(`[Stored] ${playerName} -> ${publicUrl}`);
    
    return publicUrl;
    
  } catch (error) {
    console.error(`[Error] Failed to process ${playerName}: ${error.message}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for optional parameters
    let limit = 10; // Default to 10 per batch to avoid timeouts
    let offset = 0;
    let delayMs = 3000; // Default 3 second delay between images
    let skipExisting = true; // Skip players who already have storage URLs
    
    try {
      const body = await req.json();
      limit = body?.limit ?? 10;
      offset = body?.offset ?? 0;
      delayMs = body?.delayMs ?? 3000;
      skipExisting = body?.skipExisting ?? true;
    } catch {
      // No body or invalid JSON is fine
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // NEW APPROACH: Query existing sr_players with SportRadar photo URLs
    // This avoids the rate-limited manifest API entirely!
    console.log(`Fetching players with SportRadar photo URLs (offset: ${offset}, limit: ${limit})...`);
    
    const { data: players, error: queryError, count } = await supabase
      .from('sr_players')
      .select('id, first_name, last_name, sr_id, photo_url', { count: 'exact' })
      .not('photo_url', 'is', null)
      .not('photo_url', 'like', '%supabase.co/storage%') // Exclude already migrated
      .like('photo_url', '%sportradar.com%') // Only SportRadar URLs
      .range(offset, offset + limit - 1)
      .order('first_name', { ascending: true });
    
    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }
    
    const totalToMigrate = count ?? 0;
    const playersToProcess = players ?? [];
    
    console.log(`Found ${playersToProcess.length} players to migrate (${totalToMigrate} total remaining)`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let alreadyStored = 0;
    const updatedPlayers: string[] = [];

    for (const player of playersToProcess) {
      try {
        const playerName = `${player.first_name} ${player.last_name}`;
        
        // Double-check not already stored (in case of race conditions)
        if (skipExisting && player.photo_url?.includes('supabase.co/storage')) {
          console.log(`⏭ Already stored: ${playerName}`);
          alreadyStored++;
          continue;
        }
        
        if (!player.photo_url) {
          console.log(`⏭ No photo URL: ${playerName}`);
          skipped++;
          continue;
        }

        // Download from SportRadar and store in Supabase Storage
        const storedUrl = await downloadAndStoreImage(
          supabase,
          player.photo_url,
          player.id,
          playerName
        );
        
        if (!storedUrl) {
          errors++;
          // Wait before next request if rate limited
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Update the player's photo URL to point to our storage
        const { error: updateError } = await supabase
          .from('sr_players')
          .update({
            photo_url: storedUrl,
            photo_updated_at: new Date().toISOString(),
          })
          .eq('id', player.id);

        if (updateError) {
          console.error(`Failed to update ${playerName}:`, updateError);
          errors++;
        } else {
          console.log(`✓ Migrated: ${playerName}`);
          updatedPlayers.push(playerName);
          updated++;
        }

        // Rate limiting delay between images
        console.log(`Waiting ${delayMs}ms before next image...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        
      } catch (playerError) {
        console.error(`Error processing player ${player.id}:`, playerError);
        errors++;
      }
    }

    const result = {
      success: true,
      total_remaining: totalToMigrate,
      processed: playersToProcess.length,
      updated,
      already_stored: alreadyStored,
      skipped,
      errors,
      next_offset: offset + playersToProcess.length,
      sample_updated: updatedPlayers.slice(0, 10),
      settings: { limit, offset, delayMs, skipExisting },
    };

    console.log('Sync complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
