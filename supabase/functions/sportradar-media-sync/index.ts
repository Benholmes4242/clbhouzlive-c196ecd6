import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get the appropriate API key for each service
const getImagesApiKey = (provider: string): string | null => {
  if (provider === 'ap') {
    return Deno.env.get('SPORTRADAR_IMAGES_AP_KEY') || null;
  } else if (provider === 'getty') {
    return Deno.env.get('SPORTRADAR_IMAGES_GETTY_KEY') || null;
  }
  return null;
};

const getContentApiKey = (): string | null => {
  return Deno.env.get('SPORTRADAR_CONTENT_AP_KEY') || null;
};

// Access level: t for trial, p for production
const getAccessLevel = (): string => {
  const level = Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 't';
  if (level === 'trial' || level === 't' || level === 't3') return 't';
  if (level === 'production' || level === 'p' || level === 'p3') return 'p';
  return 't';
};

// FIXED: Images API - NO league segment for golf
// Pattern: https://api.sportradar.com/golf-images-t3/{provider}/{asset_type}/manifest.xml
const getImagesBaseUrl = (provider: string) => 
  `https://api.sportradar.com/golf-images-${getAccessLevel()}3/${provider}`;

// FIXED: Content API - NO league segment
// Pattern: https://api.sportradar.us/content-golf-t3/{provider}/{type}/YYYY/MM/DD/all.xml
const getContentBaseUrl = (provider: string) =>
  `https://api.sportradar.us/content-golf-${getAccessLevel()}3/${provider}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const apImagesKey = getImagesApiKey('ap');
    const gettyImagesKey = getImagesApiKey('getty');
    const contentKey = getContentApiKey();

    console.log(`[sportradar-media-sync] Keys: AP Images=${!!apImagesKey}, Getty Images=${!!gettyImagesKey}, Content=${!!contentKey}, AccessLevel=${getAccessLevel()}3`);

    if (!apImagesKey && !gettyImagesKey) {
      return new Response(
        JSON.stringify({ error: 'No Images API keys configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, provider, year, date } = body;

    console.log(`[sportradar-media-sync] action=${action}, provider=${provider}`);

    let result: { records: number; message: string; debug?: any };

    switch (action) {
      case 'pull_headshots':
        result = await pullHeadshots(supabase, provider);
        break;
      case 'sync_player_photos':
        result = await syncPlayerPhotos(supabase, provider || 'ap');
        break;
      case 'pull_logos':
        result = await pullLogos(supabase, provider, year || 2025);
        break;
      case 'pull_venues':
        result = await pullVenues(supabase, provider);
        break;
      case 'pull_news':
        result = await pullEditorial(supabase, provider || 'ap', 'news', date);
        break;
      case 'pull_analysis':
        result = await pullEditorial(supabase, provider || 'ap', 'analysis', date);
        break;
      case 'check_availability':
        result = await checkProviderAvailability(supabase);
        break;
      case 'pull_all':
        result = await pullAllMedia(supabase);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sportradar-media-sync] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fetch manifest with detailed logging
async function fetchManifest(url: string, apiKey: string, description: string): Promise<{ ok: boolean; status: number; data?: string; error?: string; urlCalled: string }> {
  const fullUrl = `${url}?api_key=${apiKey}`;
  
  console.log(`[${description}] Fetching: ${url}`);
  
  try {
    const response = await fetch(fullUrl, {
      headers: { 'Accept': 'application/xml' },
      redirect: 'follow'
    });
    
    const responseText = await response.text();
    
    // Log status + first 200 chars for debugging
    console.log(`[${description}] HTTP ${response.status} | First 200 chars: ${responseText.substring(0, 200).replace(/\n/g, ' ')}`);
    
    if (!response.ok) {
      return { ok: false, status: response.status, error: responseText.substring(0, 300), urlCalled: url };
    }
    
    // Check for HTML (auth error)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      return { ok: false, status: response.status, error: 'Auth Error - got HTML', urlCalled: url };
    }
    
    console.log(`[${description}] Success - ${responseText.length} bytes`);
    return { ok: true, status: response.status, data: responseText, urlCalled: url };
  } catch (e) {
    console.error(`[${description}] Fetch error: ${e.message}`);
    return { ok: false, status: 0, error: e.message, urlCalled: url };
  }
}

// FIXED: Parse links with width/height attributes (not rel)
function parseManifestXml(xml: string, kind: 'headshot' | 'logo' | 'venue'): any[] {
  const assets: any[] = [];
  
  const assetRegex = /<asset([^>]*)>([\s\S]*?)<\/asset>/gi;
  const attrRegex = /(\w+)="([^"]*)"/g;
  const linkRegex = /<link([^>]*?)\/>/gi;
  
  let match;
  while ((match = assetRegex.exec(xml)) !== null) {
    const attrString = match[1];
    const innerContent = match[2];
    
    // Parse asset attributes
    const attrs: Record<string, string> = {};
    let attrMatch;
    const attrRegexCopy = /(\w+)="([^"]*)"/g;
    while ((attrMatch = attrRegexCopy.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    
    // FIXED: Parse links with width/height, derive sizeKey
    const links: Array<{ href: string; width?: number; height?: number; sizeKey: string }> = [];
    let linkMatch;
    const linkRegexCopy = /<link([^>]*?)\/>/gi;
    while ((linkMatch = linkRegexCopy.exec(innerContent)) !== null) {
      const linkAttrs: Record<string, string> = {};
      let linkAttrMatch;
      const linkAttrRegex = /(\w+)="([^"]*)"/g;
      while ((linkAttrMatch = linkAttrRegex.exec(linkMatch[1])) !== null) {
        linkAttrs[linkAttrMatch[1]] = linkAttrMatch[2];
      }
      
      if (linkAttrs.href) {
        const width = linkAttrs.width ? parseInt(linkAttrs.width) : undefined;
        const height = linkAttrs.height ? parseInt(linkAttrs.height) : undefined;
        
        // Derive sizeKey from width, height, or URL patterns
        let sizeKey = 'unknown';
        if (linkAttrs.rel) {
          sizeKey = linkAttrs.rel;
        } else if (width) {
          sizeKey = `w${width}`;
        } else if (height) {
          sizeKey = `h${height}`;
        } else if (linkAttrs.href.includes('/original')) {
          sizeKey = 'original';
        } else if (linkAttrs.href.includes('h1000')) {
          sizeKey = 'h1000';
        } else if (linkAttrs.href.includes('h500')) {
          sizeKey = 'h500';
        } else if (linkAttrs.href.includes('h250')) {
          sizeKey = 'h250';
        }
        
        links.push({
          href: linkAttrs.href,
          width,
          height,
          sizeKey
        });
      }
    }
    
    // Extract refs
    const refs: Record<string, string> = {};
    if (attrs.player_id) refs.player_id = attrs.player_id;
    if (attrs.venue_id) refs.venue_id = attrs.venue_id;
    if (attrs.team_id) refs.team_id = attrs.team_id;
    if (attrs.org_id) refs.org_id = attrs.org_id;
    
    assets.push({
      id: attrs.id,
      title: attrs.title || attrs.name,
      description: attrs.description,
      copyright: attrs.copyright,
      created: attrs.created,
      updated: attrs.updated,
      refs,
      links
    });
  }
  
  return assets;
}

// Pull player headshots - try multiple path variants
async function pullHeadshots(supabase: any, provider: string) {
  const apiKey = getImagesApiKey(provider);
  if (!apiKey) {
    return { records: 0, message: `No API key for ${provider}`, debug: {} };
  }
  
  const base = getImagesBaseUrl(provider);
  
  // Try different path variants
  const pathVariants = [
    `${base}/players/manifest.xml`,
    `${base}/headshots/players/manifest.xml`
  ];
  
  let result: { ok: boolean; status: number; data?: string; error?: string; urlCalled: string } | null = null;
  
  for (const url of pathVariants) {
    result = await fetchManifest(url, apiKey, `Headshots ${provider}`);
    if (result.ok) break;
  }
  
  if (!result || !result.ok || !result.data) {
    await updateAvailability(supabase, provider, 'headshots', result || { ok: false, status: 0, urlCalled: '' });
    return { records: 0, message: `Headshots not available: ${result?.error}`, debug: { urlsTried: pathVariants, status: result?.status } };
  }
  
  await updateAvailability(supabase, provider, 'headshots', result);
  
  const assets = parseManifestXml(result.data, 'headshot');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'headshot',
      sport: 'golf',
      league: 'golf', // No specific league for golf images
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links, // Now an array with href, width, height, sizeKey
      manifest_source_url: result.urlCalled,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
    else console.log(`[Headshots] Upsert error for ${asset.id}: ${error.message}`);
  }
  
  // After syncing to sr_media_assets, also update sr_players.photo_url
  const playerUpdateResult = await updatePlayerPhotosFromAssets(supabase);
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} headshots from ${provider}. Updated ${playerUpdateResult.updated} player photos.`,
    debug: { url: result.urlCalled, totalParsed: assets.length }
  };
}

// Update sr_players.photo_url from sr_media_assets
async function updatePlayerPhotosFromAssets(supabase: any): Promise<{ updated: number; matched: number; total: number }> {
  // Get all headshot assets that have player_id refs
  const { data: assets, error: assetsError } = await supabase
    .from('sr_media_assets')
    .select('id, refs, links')
    .eq('kind', 'headshot');
  
  if (assetsError || !assets) {
    console.log('[updatePlayerPhotosFromAssets] No headshot assets found');
    return { updated: 0, matched: 0, total: 0 };
  }
  
  let updated = 0;
  let matched = 0;
  
  for (const asset of assets) {
    const playerSrId = asset.refs?.player_id;
    if (!playerSrId) continue;
    
    // Find player by sr_id
    const { data: player, error: playerError } = await supabase
      .from('sr_players')
      .select('id, photo_url')
      .eq('sr_id', playerSrId)
      .maybeSingle();
    
    if (playerError || !player) continue;
    matched++;
    
    // Get best quality image URL (prefer original or largest)
    const links = asset.links as Array<{ href: string; width?: number; height?: number; sizeKey: string }>;
    if (!links || links.length === 0) continue;
    
    // Sort by quality: original > larger width > first available
    const sortedLinks = [...links].sort((a, b) => {
      if (a.sizeKey === 'original') return -1;
      if (b.sizeKey === 'original') return 1;
      if (a.width && b.width) return b.width - a.width;
      if (a.height && b.height) return b.height - a.height;
      return 0;
    });
    
    const bestUrl = sortedLinks[0]?.href;
    if (!bestUrl) continue;
    
    // Only update if different
    if (player.photo_url !== bestUrl) {
      const { error: updateError } = await supabase
        .from('sr_players')
        .update({ photo_url: bestUrl, updated_at: new Date().toISOString() })
        .eq('id', player.id);
      
      if (!updateError) updated++;
    }
  }
  
  console.log(`[updatePlayerPhotosFromAssets] Total: ${assets.length}, Matched: ${matched}, Updated: ${updated}`);
  return { updated, matched, total: assets.length };
}

// Sync player photos directly (standalone action)
async function syncPlayerPhotos(supabase: any, provider: string) {
  // First pull headshots to ensure we have latest data
  const pullResult = await pullHeadshots(supabase, provider);
  
  // Then update player photos
  const updateResult = await updatePlayerPhotosFromAssets(supabase);
  
  return {
    records: updateResult.updated,
    message: `Synced ${pullResult.records} headshots, matched ${updateResult.matched} players, updated ${updateResult.updated} photos`,
    debug: { 
      headshotsTotal: pullResult.records,
      playersMatched: updateResult.matched,
      photosUpdated: updateResult.updated
    }
  };
}

// Pull logos - try with and without year
async function pullLogos(supabase: any, provider: string, year: number) {
  const apiKey = getImagesApiKey(provider);
  if (!apiKey) {
    return { records: 0, message: `No API key for ${provider}`, debug: {} };
  }
  
  const base = getImagesBaseUrl(provider);
  
  // Try different path variants (trial often has no year, prod has year)
  const pathVariants = [
    `${base}/logos/manifest.xml`,
    `${base}/logos/${year}/manifest.xml`
  ];
  
  let result: { ok: boolean; status: number; data?: string; error?: string; urlCalled: string } | null = null;
  
  for (const url of pathVariants) {
    result = await fetchManifest(url, apiKey, `Logos ${provider}`);
    if (result.ok) break;
  }
  
  if (!result || !result.ok || !result.data) {
    await updateAvailability(supabase, provider, 'logos', result || { ok: false, status: 0, urlCalled: '' });
    return { records: 0, message: `Logos not available: ${result?.error}`, debug: { urlsTried: pathVariants, status: result?.status } };
  }
  
  await updateAvailability(supabase, provider, 'logos', result);
  
  const assets = parseManifestXml(result.data, 'logo');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'logo',
      sport: 'golf',
      league: 'golf',
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links,
      manifest_source_url: result.urlCalled,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} logos from ${provider}`,
    debug: { url: result.urlCalled, totalParsed: assets.length }
  };
}

// Pull venues
async function pullVenues(supabase: any, provider: string) {
  const apiKey = getImagesApiKey(provider);
  if (!apiKey) {
    return { records: 0, message: `No API key for ${provider}`, debug: {} };
  }
  
  const manifestUrl = `${getImagesBaseUrl(provider)}/venues/manifest.xml`;
  const result = await fetchManifest(manifestUrl, apiKey, `Venues ${provider}`);
  
  await updateAvailability(supabase, provider, 'venues', result);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Venues not available: ${result.error}`, debug: { url: result.urlCalled, status: result.status } };
  }
  
  const assets = parseManifestXml(result.data, 'venue');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'venue',
      sport: 'golf',
      league: 'golf',
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links,
      manifest_source_url: result.urlCalled,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} venues from ${provider}`,
    debug: { url: result.urlCalled, totalParsed: assets.length }
  };
}

// Pull editorial content (news/analysis)
async function pullEditorial(supabase: any, provider: string, type: 'news' | 'analysis', dateStr?: string) {
  const apiKey = getContentApiKey();
  if (!apiKey) {
    return { records: 0, message: 'No Content API key (SPORTRADAR_CONTENT_AP_KEY)', debug: {} };
  }
  
  const date = dateStr ? new Date(dateStr) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // FIXED: No league segment in content URL
  const contentUrl = `${getContentBaseUrl(provider)}/${type}/${year}/${month}/${day}/all.xml`;
  const result = await fetchManifest(contentUrl, apiKey, `Editorial ${type} ${provider}`);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Editorial ${type} not available: ${result.error}`, debug: { url: result.urlCalled, status: result.status } };
  }
  
  const items = parseEditorialXml(result.data, type);
  let upserted = 0;
  
  for (const item of items) {
    if (!item.id) continue;
    
    const { error } = await supabase.from('sr_editorial_items').upsert({
      id: item.id,
      sport: 'golf',
      league: 'golf',
      provider,
      type,
      title: item.title,
      byline: item.byline,
      dateline: item.dateline,
      content_long: item.content_long,
      content_long_html: item.content_long_html,
      created: item.created,
      updated: item.updated,
      refs: item.refs || {},
      assets: item.assets || {},
      original_link: item.original_link,
      provider_content_id: item.provider_content_id,
      version: item.version
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} ${type} items from ${provider}`,
    debug: { url: result.urlCalled, totalParsed: items.length }
  };
}

// Parse editorial XML
function parseEditorialXml(xml: string, type: string): any[] {
  const items: any[] = [];
  const itemRegex = /<(item|article)([^>]*)>([\s\S]*?)<\/\1>/gi;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const attrString = match[2];
    const innerContent = match[3];
    
    const attrs: Record<string, string> = {};
    let attrMatch;
    const attrRegex = /(\w+)="([^"]*)"/g;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    
    const title = extractXmlTag(innerContent, 'title') || extractXmlTag(innerContent, 'headline');
    const byline = extractXmlTag(innerContent, 'byline');
    const dateline = extractXmlTag(innerContent, 'dateline');
    const contentLong = extractXmlTag(innerContent, 'content_long') || extractXmlTag(innerContent, 'body');
    const contentLongHtml = extractXmlTag(innerContent, 'content_long_html') || extractXmlTag(innerContent, 'body_html');
    
    items.push({
      id: attrs.id || attrs.content_id,
      title,
      byline,
      dateline,
      content_long: contentLong,
      content_long_html: contentLongHtml,
      created: attrs.created,
      updated: attrs.updated,
      original_link: attrs.link,
      provider_content_id: attrs.provider_id,
      version: attrs.version
    });
  }
  
  return items;
}

function extractXmlTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Update availability status
async function updateAvailability(supabase: any, provider: string, assetType: string, result: { ok: boolean; status: number; error?: string; urlCalled: string }) {
  await supabase.from('sr_media_provider_availability').upsert({
    sport: 'golf',
    league: 'golf',
    provider,
    asset_type: assetType,
    status: result.ok ? 'available' : 'unavailable',
    last_checked_at: new Date().toISOString(),
    http_status: result.status,
    error_message: result.error || null,
    manifest_url: result.urlCalled || null
  }, { onConflict: 'sport,league,provider,asset_type' });
}

// Check availability - golf-only, no leagues
async function checkProviderAvailability(supabase: any) {
  const results: any[] = [];
  const providers = ['ap', 'getty'];
  
  // Images endpoints to check
  for (const provider of providers) {
    const apiKey = getImagesApiKey(provider);
    if (!apiKey) {
      console.log(`[checkAvailability] Skipping ${provider} - no API key`);
      continue;
    }
    
    const base = getImagesBaseUrl(provider);
    
    // Check headshots (try variants)
    const headshotPaths = [
      `${base}/players/manifest.xml`,
      `${base}/headshots/players/manifest.xml`
    ];
    let headshotResult: any = null;
    for (const url of headshotPaths) {
      headshotResult = await fetchManifest(url, apiKey, 'Check headshots');
      if (headshotResult.ok) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (headshotResult) {
      await updateAvailability(supabase, provider, 'headshots', headshotResult);
      results.push({ provider, assetType: 'headshots', status: headshotResult.ok ? 'available' : 'unavailable', httpStatus: headshotResult.status, url: headshotResult.urlCalled });
    }
    
    // Check logos (try variants)
    const logoPaths = [
      `${base}/logos/manifest.xml`,
      `${base}/logos/2025/manifest.xml`
    ];
    let logoResult: any = null;
    for (const url of logoPaths) {
      logoResult = await fetchManifest(url, apiKey, 'Check logos');
      if (logoResult.ok) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (logoResult) {
      await updateAvailability(supabase, provider, 'logos', logoResult);
      results.push({ provider, assetType: 'logos', status: logoResult.ok ? 'available' : 'unavailable', httpStatus: logoResult.status, url: logoResult.urlCalled });
    }
    
    // Check venues
    const venueUrl = `${base}/venues/manifest.xml`;
    const venueResult = await fetchManifest(venueUrl, apiKey, 'Check venues');
    await updateAvailability(supabase, provider, 'venues', venueResult);
    results.push({ provider, assetType: 'venues', status: venueResult.ok ? 'available' : 'unavailable', httpStatus: venueResult.status, url: venueResult.urlCalled });
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Check editorial content
  const contentKey = getContentApiKey();
  if (contentKey) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    for (const provider of ['ap', 'ap_premium']) {
      for (const type of ['news', 'analysis']) {
        const url = `${getContentBaseUrl(provider)}/${type}/${year}/${month}/${day}/all.xml`;
        const result = await fetchManifest(url, contentKey, `Check ${type} ${provider}`);
        results.push({ provider, assetType: type, status: result.ok ? 'available' : 'unavailable', httpStatus: result.status, url: result.urlCalled });
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }
  
  const availableCount = results.filter(r => r.status === 'available').length;
  
  return { 
    records: results.length, 
    message: `Checked ${results.length} endpoints. ${availableCount} available.`,
    debug: { results, accessLevel: `${getAccessLevel()}3` }
  };
}

// Pull all available media
async function pullAllMedia(supabase: any) {
  let totalRecords = 0;
  const results: any[] = [];
  
  // Check availability first
  await checkProviderAvailability(supabase);
  
  // Get available combinations
  const { data: available } = await supabase
    .from('sr_media_provider_availability')
    .select('*')
    .eq('sport', 'golf')
    .eq('status', 'available');
  
  if (!available || available.length === 0) {
    return { records: 0, message: 'No available sources found. Check logs for endpoint details.' };
  }
  
  for (const combo of available) {
    let result: { records: number; message: string };
    
    switch (combo.asset_type) {
      case 'headshots':
        result = await pullHeadshots(supabase, combo.provider);
        break;
      case 'logos':
        result = await pullLogos(supabase, combo.provider, 2025);
        break;
      case 'venues':
        result = await pullVenues(supabase, combo.provider);
        break;
      default:
        continue;
    }
    
    totalRecords += result.records;
    results.push({ ...combo, ...result });
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} assets from ${results.length} sources`,
    debug: { results }
  };
}
