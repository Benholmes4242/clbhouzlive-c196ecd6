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
  assetlist: {
    assets: ManifestAsset[];
    manifest_date: string;
    provider: string;
    league: string;
    entity: string;
    type: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GETTY_API_KEY) {
      throw new Error('SPORTRADAR_GETTY_IMAGES_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const year = new Date().getFullYear();

    console.log(`Fetching Getty Golf headshots manifest for ${year}...`);

    // Step 1: Fetch the player manifest
    const manifestUrl = `https://api.sportradar.com/golf-images-${ACCESS_LEVEL}3/getty/pga/headshots/players/${year}/manifest.json?api_key=${GETTY_API_KEY}`;
    
    const manifestResponse = await fetch(manifestUrl);
    
    if (!manifestResponse.ok) {
      const errorText = await manifestResponse.text();
      throw new Error(`Manifest fetch failed: ${manifestResponse.status} - ${errorText}`);
    }

    const manifest: ManifestResponse = await manifestResponse.json();
    const assets = manifest.assetlist?.assets || [];

    console.log(`Found ${assets.length} player headshots in manifest`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updatedPlayers: string[] = [];

    // Step 2: Process each asset
    for (const asset of assets) {
      try {
        // Find the player reference with SportRadar ID
        const playerRef = asset.refs?.find(
          (ref) => ref.type === 'profile' && ref.sportradar_id
        );

        if (!playerRef?.sportradar_id) {
          skipped++;
          continue;
        }

        // Get the best image size (prefer h500, fallback to h250, then first available)
        const imageLink =
          asset.links?.find((link) => link.href.includes('h500')) ||
          asset.links?.find((link) => link.href.includes('h250')) ||
          asset.links?.[0];

        if (!imageLink) {
          skipped++;
          continue;
        }

        // Extract filename from href
        const fileName = imageLink.href.split('/').pop();

        // Construct the full image URL
        const imageUrl = `https://api.sportradar.com/golf-images-${ACCESS_LEVEL}3/getty/pga/headshots/players/${asset.id}/${fileName}?api_key=${GETTY_API_KEY}`;

        // Try matching by various ID formats SportRadar uses
        const sportradarId = playerRef.sportradar_id;
        
        // First try exact match on sr_id column (TEXT field)
        let { data: player } = await supabase
          .from('sr_players')
          .select('id, first_name, last_name, sr_id')
          .eq('sr_id', sportradarId)
          .maybeSingle();

        // If not found, try matching by the numeric ID if it's in sr:player:XXX format
        if (!player && sportradarId.startsWith('sr:player:')) {
          const numericId = sportradarId.replace('sr:player:', '');
          const { data: altPlayer } = await supabase
            .from('sr_players')
            .select('id, first_name, last_name, sr_id')
            .eq('sr_id', `sr:competitor:${numericId}`)
            .maybeSingle();
          player = altPlayer;
        }

        // Also try sr:competitor format
        if (!player) {
          const { data: altPlayer } = await supabase
            .from('sr_players')
            .select('id, first_name, last_name, sr_id')
            .eq('sr_id', sportradarId.replace('sr:player:', 'sr:competitor:'))
            .maybeSingle();
          player = altPlayer;
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
      manifest_date: manifest.assetlist?.manifest_date,
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
