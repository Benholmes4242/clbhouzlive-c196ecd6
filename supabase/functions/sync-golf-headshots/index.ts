import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETTY_API_KEY = Deno.env.get('SPORTRADAR_GETTY_IMAGES_API_KEY');
const ACCESS_LEVEL = 't'; // 't' for trial, 'p' for production
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  // assetlist is an ARRAY of assets, not an object
  assetlist: ManifestAsset[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for optional limit parameter
    let limit = 0; // 0 means no limit
    try {
      const body = await req.json();
      limit = body?.limit || 0;
    } catch {
      // No body or invalid JSON is fine
    }
    
    if (!GETTY_API_KEY) {
      throw new Error('SPORTRADAR_GETTY_IMAGES_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Try current year first, fallback to previous year
    const currentYear = new Date().getFullYear();
    const yearsToTry = [currentYear, currentYear - 1];
    
    let manifest: ManifestResponse | null = null;
    let usedYear = currentYear;
    
    for (const year of yearsToTry) {
      console.log(`Fetching Getty Golf headshots manifest for ${year}...`);
      
      const manifestUrl = `https://api.sportradar.com/golf-images-${ACCESS_LEVEL}3/getty/pga/headshots/players/${year}/manifest.json?api_key=${GETTY_API_KEY}`;
      console.log(`API URL: ${manifestUrl.replace(GETTY_API_KEY!, '[REDACTED]')}`);
      
      const manifestResponse = await fetch(manifestUrl);
      
      console.log(`API Response Status: ${manifestResponse.status}`);
      
      if (!manifestResponse.ok) {
        const errorText = await manifestResponse.text();
        console.log(`Year ${year} failed: ${manifestResponse.status} - ${errorText}`);
        continue;
      }

      const rawText = await manifestResponse.text();
      console.log(`Raw response (first 500 chars): ${rawText.substring(0, 500)}`);
      
      try {
        manifest = JSON.parse(rawText);
        usedYear = year;
        
        // Log the structure to understand the response
        console.log(`Response keys: ${Object.keys(manifest || {}).join(', ')}`);
        
        // assetlist is directly an array, not an object with an assets property
        if (Array.isArray(manifest?.assetlist) && manifest.assetlist.length > 0) {
          console.log(`Found ${manifest.assetlist.length} assets for year ${year}`);
          break;
        } else {
          console.log(`No assets found for year ${year}, trying next...`);
        }
      } catch (parseError) {
        console.error(`Failed to parse JSON for year ${year}:`, parseError);
      }
    }
    
    // assetlist is an array directly
    const assets = Array.isArray(manifest?.assetlist) ? manifest.assetlist : [];
    console.log(`Final: Found ${assets.length} player headshots in manifest (year: ${usedYear})`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updatedPlayers: string[] = [];
    
    // Apply limit if specified
    const assetsToProcess = limit > 0 ? assets.slice(0, limit) : assets;
    console.log(`Processing ${assetsToProcess.length} of ${assets.length} assets${limit > 0 ? ` (limit: ${limit})` : ''}`);

    // Step 2: Process each asset
    for (const asset of assetsToProcess) {
      try {
        // The player_id is provided directly in the asset (it's a UUID)
        const playerId = asset.player_id;
        
        // Also check refs for sportradar_id as fallback
        const playerRef = asset.refs?.find(
          (ref) => ref.type === 'profile' && ref.sportradar_id
        );
        
        if (!playerId && !playerRef?.sportradar_id) {
          console.log(`Asset ${asset.id} (${asset.title}) has no player_id or refs`);
          skipped++;
          continue;
        }

        // Get the best image size (prefer h500, fallback to h250, then first available)
        const imageLink =
          asset.links?.find((link) => link.href?.includes('h500')) ||
          asset.links?.find((link) => link.href?.includes('h250')) ||
          asset.links?.[0];

        if (!imageLink?.href) {
          console.log(`Asset ${asset.id} has no valid image links`);
          skipped++;
          continue;
        }

        // Extract filename from href
        const fileName = imageLink.href.split('/').pop();

        // Construct the full image URL
        const imageUrl = `https://api.sportradar.com/golf-images-${ACCESS_LEVEL}3/getty/pga/headshots/players/${asset.id}/${fileName}?api_key=${GETTY_API_KEY}`;

        // Try to find player in our database
        let player: { id: string; first_name: string; last_name: string; sr_id: string } | null = null;
        
        // First try by player_id (UUID format - might match our sr_id if it's in that format)
        if (playerId) {
          // Try exact match
          const { data: p1 } = await supabase
            .from('sr_players')
            .select('id, first_name, last_name, sr_id')
            .eq('sr_id', playerId)
            .maybeSingle();
          player = p1;
          
          // Try with sr:competitor: prefix
          if (!player) {
            const { data: p2 } = await supabase
              .from('sr_players')
              .select('id, first_name, last_name, sr_id')
              .eq('sr_id', `sr:competitor:${playerId}`)
              .maybeSingle();
            player = p2;
          }
        }
        
        // Fallback to refs sportradar_id
        if (!player && playerRef?.sportradar_id) {
          const sportradarId = playerRef.sportradar_id;
          
          const { data: p3 } = await supabase
            .from('sr_players')
            .select('id, first_name, last_name, sr_id')
            .eq('sr_id', sportradarId)
            .maybeSingle();
          player = p3;
          
          // Try sr:competitor format
          if (!player && sportradarId.startsWith('sr:player:')) {
            const { data: p4 } = await supabase
              .from('sr_players')
              .select('id, first_name, last_name, sr_id')
              .eq('sr_id', sportradarId.replace('sr:player:', 'sr:competitor:'))
              .maybeSingle();
            player = p4;
          }
        }

        if (!player) {
          console.log(`Player not found for SportRadar ID: ${sportradarId} (${asset.title})`);
          skipped++;
          continue;
        }

        // Update the player's photo URL
        const { error: updateError } = await supabase
          .from('sr_players')
          .update({
            photo_url: imageUrl,
            photo_asset_id: asset.id,
            photo_updated_at: new Date().toISOString(),
          })
          .eq('id', player.id);

        if (updateError) {
          console.error(`Failed to update ${asset.title}:`, updateError);
          errors++;
        } else {
          console.log(`✓ Updated headshot for ${player.first_name} ${player.last_name}`);
          updatedPlayers.push(`${player.first_name} ${player.last_name}`);
          updated++;
        }

        // Rate limiting - be gentle with the API
        await new Promise((resolve) => setTimeout(resolve, 100));
        
      } catch (assetError) {
        console.error(`Error processing asset ${asset.id}:`, assetError);
        errors++;
      }
    }

    const result = {
      success: true,
      manifest_date: manifest?.manifest_date,
      year_used: usedYear,
      total_assets: assets.length,
      updated,
      skipped,
      errors,
      sample_updated: updatedPlayers.slice(0, 10),
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
