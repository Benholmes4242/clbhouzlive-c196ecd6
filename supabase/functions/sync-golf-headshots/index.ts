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
    // Parse request body for optional parameters
    let limit = 0; // 0 means no limit
    let offset = 0; // Starting position
    let yearOverride = 0; // 0 means use auto-detection
    try {
      const body = await req.json();
      limit = body?.limit || 0;
      offset = body?.offset || 0;
      yearOverride = body?.year || 0;
    } catch {
      // No body or invalid JSON is fine
    }
    
    if (!GETTY_API_KEY) {
      throw new Error('SPORTRADAR_GETTY_IMAGES_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Try specific year if provided, otherwise try current year first, fallback to previous year
    const currentYear = new Date().getFullYear();
    const yearsToTry = yearOverride > 0 ? [yearOverride] : [currentYear, currentYear - 1];
    
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
    
    // Apply offset and limit if specified
    const slicedAssets = offset > 0 ? assets.slice(offset) : assets;
    const assetsToProcess = limit > 0 ? slicedAssets.slice(0, limit) : slicedAssets;
    console.log(`Processing ${assetsToProcess.length} of ${assets.length} assets (offset: ${offset}, limit: ${limit || 'all'})`);

    // Step 2: Process each asset
    for (const asset of assetsToProcess) {
      try {
        // The player_id is provided directly in the asset (it's a UUID)
        const playerId = asset.player_id;
        
        // Also check refs for sportradar_id and player name
        const playerRef = asset.refs?.find(
          (ref) => ref.type === 'profile' && ref.sportradar_id
        );
        
        // Get player name from refs if title is generic
        const playerNameFromRef = playerRef?.name || null;
        const displayName = (asset.title && !asset.title.includes('Official PGA TOUR')) 
          ? asset.title 
          : playerNameFromRef;
        
        if (!playerId && !playerRef?.sportradar_id) {
          console.log(`Asset ${asset.id} has no player_id or refs`);
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

        // NAME-BASED FALLBACK: If no match by ID, try matching by first_name + last_name
        // Use displayName which includes player name from refs if title is generic
        if (!player && displayName) {
          // Getty name format is usually "FirstName LastName" or "LastName, FirstName"
          const nameToParse = displayName;
          const titleParts = nameToParse.includes(',') 
            ? nameToParse.split(',').map(s => s.trim()).reverse() 
            : nameToParse.split(' ');
          
          const firstName = titleParts[0]?.trim();
          const lastName = titleParts.slice(1).join(' ')?.trim() || titleParts[1]?.trim();
          
          if (firstName && lastName) {
            // Try exact case-insensitive match
            const { data: nameMatch } = await supabase
              .from('sr_players')
              .select('id, first_name, last_name, sr_id')
              .ilike('first_name', firstName)
              .ilike('last_name', lastName)
              .maybeSingle();
            
            if (nameMatch) {
              player = nameMatch;
              console.log(`✓ Matched by NAME: ${firstName} ${lastName} -> ${nameMatch.first_name} ${nameMatch.last_name}`);
            }
          }
        }

        // Log unmatched players for debugging (include ref name if available)
        if (!player) {
          const refInfo = playerRef ? ` (ref: ${playerRef.name || 'unknown'}, sr_id: ${playerRef.sportradar_id})` : '';
          console.log(`UNMATCHED: ${displayName || asset.title} (player_id: ${playerId || 'none'})${refInfo}`);
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

        // Rate limiting - reduced from 100ms to 50ms for faster processing
        await new Promise((resolve) => setTimeout(resolve, 50));
        
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
