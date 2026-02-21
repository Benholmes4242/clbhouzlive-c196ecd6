const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RANKINGS_URL = 'https://www.europeantour.com/dpworld-tour/rankings/overview/rankings/';
const TOUR_CODE = 'euro';

// DP World Tour season runs roughly Nov-Nov
// If we're in Jan-Oct, use current year. If Nov-Dec, use next year.
const now = new Date();
const SEASON_YEAR = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();

async function scrape() {
  console.log(`[R2D Scraper] Starting for season ${SEASON_YEAR}...`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    console.log(`[R2D Scraper] Navigating to ${RANKINGS_URL}`);
    await page.goto(RANKINGS_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the rankings table to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    // Extract data from the table
    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const data = [];
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return;
        const texts = Array.from(cells).map(c => c.textContent.trim());

        const pos = parseInt(texts[2]);
        if (isNaN(pos) || pos <= 0) return;

        // Position change in cell[3]
        const posChange = texts[3] || '';

        // Player name in cell[5] — strip sponsor logos
        const name = texts[5]
          .replace(/Titleist Logo/g, '')
          .replace(/Titleist/g, '')
          .trim();

        // Country from flag image alt text
        const flagImg = cells[4]?.querySelector('img');
        const country = flagImg ? flagImg.getAttribute('alt') || '' : '';

        const tournamentsPlayed = parseInt(texts[7]) || null;
        const points = parseFloat(texts[8]?.replace(/,/g, '')) || null;

        if (name && pos > 0) {
          data.push({
            position: pos,
            position_change: posChange,
            name,
            country,
            tournaments_played: tournamentsPlayed,
            points
          });
        }
      });
      return data;
    });

    console.log(`[R2D Scraper] Parsed ${players.length} players`);

    if (players.length === 0) {
      throw new Error('No players parsed — HTML structure may have changed');
    }

    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Build rows for upsert
    const rows = players.map(p => ({
      player_name: p.name,
      tour_code: TOUR_CODE,
      season_year: SEASON_YEAR,
      position: p.position,
      position_change: p.position_change || null,
      points: p.points,
      tournaments_played: p.tournaments_played,
      country: p.country || null,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Upsert in batches of 50
    let upserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from('tour_season_rankings')
        .upsert(batch, { onConflict: 'tour_code,season_year,player_name' });
      if (error) {
        console.error('[R2D Scraper] Upsert error:', error.message);
      } else {
        upserted += batch.length;
      }
    }

    console.log(`[R2D Scraper] Upserted ${upserted} players`);

    // Run player matching RPC
    const { error: matchError } = await supabase.rpc('match_tour_rankings_players');
    if (matchError) {
      console.log('[R2D Scraper] Player matching RPC not available or failed, skipping auto-match:', matchError.message);
    } else {
      console.log('[R2D Scraper] Player matching RPC executed successfully');
    }

    // Report final stats
    const { data: stats } = await supabase
      .from('tour_season_rankings')
      .select('player_id')
      .eq('tour_code', TOUR_CODE)
      .eq('season_year', SEASON_YEAR);

    const matched = stats?.filter(r => r.player_id).length || 0;
    const total = stats?.length || 0;
    console.log(`[R2D Scraper] Complete: ${total} total, ${matched} matched, ${total - matched} unmatched`);

  } finally {
    await browser.close();
  }
}

scrape().catch(err => {
  console.error('[R2D Scraper] Fatal error:', err);
  process.exit(1);
});
