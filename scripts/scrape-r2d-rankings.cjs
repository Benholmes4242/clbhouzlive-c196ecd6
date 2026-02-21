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

    // Scrape LPGA Race to CME Globe
    await scrapeLPGA(browser, supabase);

  } finally {
    await browser.close();
  }
}

async function scrapeLPGA(browser, supabase) {
  const LPGA_URL = 'https://www.lpga.com/stats-and-rankings/race-to-cme-globe/rankings';
  const LPGA_TOUR_CODE = 'lpga';
  const now = new Date();
  const LPGA_SEASON_YEAR = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();

  console.log(`[LPGA Scraper] Starting for season ${LPGA_SEASON_YEAR}...`);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    await page.goto(LPGA_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for player links to appear (JS-rendered table)
    await page.waitForFunction(() => {
      return document.querySelectorAll('a[href*="/athletes/"]').length > 5;
    }, { timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));

    const players = await page.evaluate(() => {
      const data = [];
      const seen = new Set();

      // The rankings page renders rows with: rank, photo, name (as link), country, fav star, CME points, total points, events, wins, top10, points rank
      const rows = document.querySelectorAll('tr, [class*="row"], [class*="item"]');

      rows.forEach(row => {
        const link = row.querySelector('a[href*="/athletes/"]');
        if (!link) return;

        const name = link.textContent.trim().replace(/\s+/g, ' ');
        if (!name || name.length < 3 || seen.has(name)) return;

        const cells = row.querySelectorAll('td, [class*="cell"], [class*="col"], span, div');
        const values = Array.from(cells).map(c => c.textContent.trim()).filter(Boolean);

        // Find rank: first small number (1-200)
        let rank = null;
        for (const v of values) {
          const n = parseInt(v);
          if (!isNaN(n) && n > 0 && n < 300 && v === String(n)) { rank = n; break; }
        }

        // Find points: number with exactly 3 decimal places (CME format: 500.000, 67.833)
        let points = null;
        for (const v of values) {
          const match = v.match(/^([\d,]+\.\d{3})$/);
          if (match) { points = parseFloat(match[1].replace(/,/g, '')); break; }
        }

        // Find country: 3-letter uppercase code
        let country = '';
        for (const v of values) {
          if (/^[A-Z]{3}$/.test(v)) { country = v; break; }
        }

        if (rank && name && points !== null) {
          seen.add(name);
          data.push({ position: rank, name, country, points });
        }
      });

      data.sort((a, b) => a.position - b.position || b.points - a.points);
      return data;
    });

    console.log(`[LPGA Scraper] Parsed ${players.length} players`);

    if (players.length === 0) {
      console.log('[LPGA Scraper] No players parsed — HTML structure may have changed, skipping');
      return;
    }

    const rows = players.map(p => ({
      player_name: p.name,
      tour_code: LPGA_TOUR_CODE,
      season_year: LPGA_SEASON_YEAR,
      position: p.position,
      points: p.points,
      tournaments_played: null,
      country: p.country || null,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    let upserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from('tour_season_rankings')
        .upsert(batch, { onConflict: 'tour_code,season_year,player_name' });
      if (error) {
        console.error('[LPGA Scraper] Upsert error:', error.message);
      } else {
        upserted += batch.length;
      }
    }
    console.log(`[LPGA Scraper] Upserted ${upserted} players`);

    // Match LPGA players
    const { data: lpgaPlayers } = await supabase
      .from('sr_players')
      .select('id, full_name, last_name, first_name')
      .contains('tour_codes', ['LPGA']);

    if (lpgaPlayers && lpgaPlayers.length > 0) {
      let matched = 0;
      for (const row of rows) {
        if (!row.player_name) continue;
        const match = lpgaPlayers.find(p => {
          const fullUpper = p.full_name?.toUpperCase();
          const scraped = row.player_name.toUpperCase();
          return fullUpper === scraped ||
                 fullUpper === scraped.replace(/\s+/g, ' ').trim();
        });
        if (match) {
          await supabase
            .from('tour_season_rankings')
            .update({ player_id: match.id })
            .eq('tour_code', LPGA_TOUR_CODE)
            .eq('season_year', LPGA_SEASON_YEAR)
            .eq('player_name', row.player_name);
          matched++;
        }
      }
      console.log(`[LPGA Scraper] Matched ${matched} of ${rows.length} players`);
    }

  } catch (err) {
    console.error('[LPGA Scraper] Error:', err.message);
  } finally {
    await page.close();
  }
}

scrape().catch(err => {
  console.error('[R2D Scraper] Fatal error:', err);
  process.exit(1);
});
