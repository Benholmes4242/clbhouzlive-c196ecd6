import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Golf leagues to check - can be expanded
const GOLF_LEAGUES = ['pga', 'lpga', 'dpwt', 'korn_ferry'];
const PROVIDERS = ['ap', 'getty'];

const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'trial';

// Images API v3 base URL
const getImagesBaseUrl = (provider: string, league: string) => 
  `https://api.sportradar.com/golf-images-${getAccessLevel()}3/${provider}/${league}`;

// Editorial Content API v3 base URL  
const getContentBaseUrl = (provider: string, league: string) =>
  `https://api.sportradar.com/content-golf-${getAccessLevel()}3/${provider}/${league}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sportradarApiKey = Deno.env.get('SPORTRADAR_API_KEY');

    if (!sportradarApiKey) {
      return new Response(
        JSON.stringify({ error: 'SPORTRADAR_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { 
      action,
      league,
      provider,
      year,
      date,
      assetType // 'headshots' | 'logos' | 'venues'
    } = body;

    console.log(`[sportradar-media-sync] action=${action}, league=${league}, provider=${provider}, accessLevel=${getAccessLevel()}`);

    let result: { records: number; message: string; debug?: any };

    switch (action) {
      case 'pull_headshots':
        result = await pullHeadshots(supabase, sportradarApiKey, league, provider);
        break;
      case 'pull_logos':
        result = await pullLogos(supabase, sportradarApiKey, league, provider, year || 2025);
        break;
      case 'pull_venues':
        result = await pullVenues(supabase, sportradarApiKey, league, provider);
        break;
      case 'pull_news':
        result = await pullEditorial(supabase, sportradarApiKey, league, provider, 'news', date);
        break;
      case 'pull_analysis':
        result = await pullEditorial(supabase, sportradarApiKey, league, provider, 'analysis', date);
        break;
      case 'check_availability':
        result = await checkProviderAvailability(supabase, sportradarApiKey);
        break;
      case 'pull_all':
        result = await pullAllMedia(supabase, sportradarApiKey);
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

// Fetch XML manifest from Sportradar, following redirects
async function fetchManifest(url: string, apiKey: string, description: string): Promise<{ ok: boolean; status: number; data?: string; error?: string }> {
  console.log(`[${description}] Fetching: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/xml'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[${description}] HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      return { ok: false, status: response.status, error: errorText.substring(0, 200) };
    }
    
    const data = await response.text();
    console.log(`[${description}] HTTP ${response.status} - Got ${data.length} bytes`);
    return { ok: true, status: response.status, data };
  } catch (e) {
    console.error(`[${description}] Fetch error: ${e.message}`);
    return { ok: false, status: 0, error: e.message };
  }
}

// Parse XML manifest to extract asset entries
function parseManifestXml(xml: string, kind: 'headshot' | 'logo' | 'venue'): any[] {
  const assets: any[] = [];
  
  // Simple XML parsing for asset elements
  // Format: <asset id="..." title="..." ...><link href="..." rel="..." /></asset>
  const assetRegex = /<asset([^>]*)>([\s\S]*?)<\/asset>/gi;
  const attrRegex = /(\w+)="([^"]*)"/g;
  const linkRegex = /<link([^>]*?)\/>/gi;
  
  let match;
  while ((match = assetRegex.exec(xml)) !== null) {
    const attrString = match[1];
    const innerContent = match[2];
    
    // Parse attributes
    const attrs: Record<string, string> = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    
    // Parse links
    const links: Record<string, string> = {};
    let linkMatch;
    while ((linkMatch = linkRegex.exec(innerContent)) !== null) {
      const linkAttrs: Record<string, string> = {};
      let linkAttrMatch;
      const linkAttrRegex = /(\w+)="([^"]*)"/g;
      while ((linkAttrMatch = linkAttrRegex.exec(linkMatch[1])) !== null) {
        linkAttrs[linkAttrMatch[1]] = linkAttrMatch[2];
      }
      if (linkAttrs.rel && linkAttrs.href) {
        links[linkAttrs.rel] = linkAttrs.href;
      }
    }
    
    // Extract refs based on kind
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

// Pull player headshots manifest
async function pullHeadshots(supabase: any, apiKey: string, league: string, provider: string) {
  const manifestUrl = `${getImagesBaseUrl(provider, league)}/players/manifest.xml`;
  const result = await fetchManifest(manifestUrl, apiKey, `Headshots ${provider}/${league}`);
  
  // Update availability
  await updateAvailability(supabase, league, provider, 'headshots', result);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Headshots not available: ${result.error}`, debug: { manifestUrl, status: result.status } };
  }
  
  const assets = parseManifestXml(result.data, 'headshot');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'headshot',
      sport: 'golf',
      league,
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links,
      manifest_source_url: manifestUrl,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} headshots from ${provider}/${league}`,
    debug: { manifestUrl, totalParsed: assets.length }
  };
}

// Pull logos manifest
async function pullLogos(supabase: any, apiKey: string, league: string, provider: string, year: number) {
  const manifestUrl = `${getImagesBaseUrl(provider, league)}/logos/${year}/manifest.xml`;
  const result = await fetchManifest(manifestUrl, apiKey, `Logos ${provider}/${league}/${year}`);
  
  // Update availability
  await updateAvailability(supabase, league, provider, 'logos', result);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Logos not available: ${result.error}`, debug: { manifestUrl, status: result.status } };
  }
  
  const assets = parseManifestXml(result.data, 'logo');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'logo',
      sport: 'golf',
      league,
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links,
      manifest_source_url: manifestUrl,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} logos from ${provider}/${league}`,
    debug: { manifestUrl, totalParsed: assets.length }
  };
}

// Pull venues manifest
async function pullVenues(supabase: any, apiKey: string, league: string, provider: string) {
  const manifestUrl = `${getImagesBaseUrl(provider, league)}/venues/manifest.xml`;
  const result = await fetchManifest(manifestUrl, apiKey, `Venues ${provider}/${league}`);
  
  // Update availability
  await updateAvailability(supabase, league, provider, 'venues', result);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Venues not available: ${result.error}`, debug: { manifestUrl, status: result.status } };
  }
  
  const assets = parseManifestXml(result.data, 'venue');
  let upserted = 0;
  
  for (const asset of assets) {
    if (!asset.id) continue;
    
    const { error } = await supabase.from('sr_media_assets').upsert({
      id: asset.id,
      kind: 'venue',
      sport: 'golf',
      league,
      provider,
      title: asset.title,
      description: asset.description,
      copyright: asset.copyright,
      refs: asset.refs,
      links: asset.links,
      manifest_source_url: manifestUrl,
      last_seen_at: new Date().toISOString(),
      updated_at: asset.updated ? new Date(asset.updated).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });
    
    if (!error) upserted++;
  }
  
  return { 
    records: upserted, 
    message: `Synced ${upserted} venues from ${provider}/${league}`,
    debug: { manifestUrl, totalParsed: assets.length }
  };
}

// Pull editorial content (news/analysis)
async function pullEditorial(supabase: any, apiKey: string, league: string, provider: string, type: 'news' | 'analysis', dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const contentUrl = `${getContentBaseUrl(provider, league)}/${type}/${year}/${month}/${day}/all.xml`;
  const result = await fetchManifest(contentUrl, apiKey, `Editorial ${type} ${provider}/${league}`);
  
  if (!result.ok || !result.data) {
    return { records: 0, message: `Editorial ${type} not available: ${result.error}`, debug: { contentUrl, status: result.status } };
  }
  
  // Parse editorial items from XML
  const items = parseEditorialXml(result.data, type);
  let upserted = 0;
  
  for (const item of items) {
    if (!item.id) continue;
    
    const { error } = await supabase.from('sr_editorial_items').upsert({
      id: item.id,
      sport: 'golf',
      league,
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
    message: `Synced ${upserted} ${type} items from ${provider}/${league}`,
    debug: { contentUrl, totalParsed: items.length }
  };
}

// Parse editorial XML
function parseEditorialXml(xml: string, type: string): any[] {
  const items: any[] = [];
  
  // Match <item> or <article> elements
  const itemRegex = /<(item|article)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const attrRegex = /(\w+)="([^"]*)"/g;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const attrString = match[2];
    const innerContent = match[3];
    
    // Parse attributes
    const attrs: Record<string, string> = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    
    // Extract content fields
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

// Helper to extract content from XML tag
function extractXmlTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Update provider availability status
async function updateAvailability(supabase: any, league: string, provider: string, assetType: string, result: { ok: boolean; status: number; error?: string }) {
  await supabase.from('sr_media_provider_availability').upsert({
    sport: 'golf',
    league,
    provider,
    asset_type: assetType,
    status: result.ok ? 'available' : 'unavailable',
    last_checked_at: new Date().toISOString(),
    http_status: result.status,
    error_message: result.error || null
  }, { onConflict: 'sport,league,provider,asset_type' });
}

// Check all provider/league combinations for availability
async function checkProviderAvailability(supabase: any, apiKey: string) {
  const results: any[] = [];
  
  for (const league of GOLF_LEAGUES) {
    for (const provider of PROVIDERS) {
      for (const assetType of ['headshots', 'logos', 'venues']) {
        let manifestUrl: string;
        switch (assetType) {
          case 'headshots':
            manifestUrl = `${getImagesBaseUrl(provider, league)}/players/manifest.xml`;
            break;
          case 'logos':
            manifestUrl = `${getImagesBaseUrl(provider, league)}/logos/2025/manifest.xml`;
            break;
          case 'venues':
            manifestUrl = `${getImagesBaseUrl(provider, league)}/venues/manifest.xml`;
            break;
          default:
            continue;
        }
        
        console.log(`[checkAvailability] Checking ${provider}/${league}/${assetType}...`);
        const result = await fetchManifest(manifestUrl, apiKey, `Availability check`);
        
        await supabase.from('sr_media_provider_availability').upsert({
          sport: 'golf',
          league,
          provider,
          asset_type: assetType,
          status: result.ok ? 'available' : 'unavailable',
          last_checked_at: new Date().toISOString(),
          http_status: result.status,
          error_message: result.error || null,
          manifest_url: manifestUrl
        }, { onConflict: 'sport,league,provider,asset_type' });
        
        results.push({
          league,
          provider,
          assetType,
          status: result.ok ? 'available' : 'unavailable',
          httpStatus: result.status
        });
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }
  
  return { 
    records: results.length, 
    message: `Checked ${results.length} provider/league combinations`,
    debug: { results }
  };
}

// Pull all available media (headshots, logos, venues) for all leagues/providers
async function pullAllMedia(supabase: any, apiKey: string) {
  let totalRecords = 0;
  const results: any[] = [];
  
  // First check availability
  await checkProviderAvailability(supabase, apiKey);
  
  // Get available combinations
  const { data: available } = await supabase
    .from('sr_media_provider_availability')
    .select('*')
    .eq('sport', 'golf')
    .eq('status', 'available');
  
  if (!available || available.length === 0) {
    return { records: 0, message: 'No available provider/league combinations found' };
  }
  
  for (const combo of available) {
    let result: { records: number; message: string };
    
    switch (combo.asset_type) {
      case 'headshots':
        result = await pullHeadshots(supabase, apiKey, combo.league, combo.provider);
        break;
      case 'logos':
        result = await pullLogos(supabase, apiKey, combo.league, combo.provider, 2025);
        break;
      case 'venues':
        result = await pullVenues(supabase, apiKey, combo.league, combo.provider);
        break;
      default:
        continue;
    }
    
    totalRecords += result.records;
    results.push({ ...combo, ...result });
    
    // Delay between requests
    await new Promise(r => setTimeout(r, 300));
  }
  
  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} total assets from ${results.length} sources`,
    debug: { results }
  };
}
