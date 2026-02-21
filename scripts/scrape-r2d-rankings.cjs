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

    // Wait for rankings content to load
    await page.waitForSelector('[class*="ranking"], [class*="standings"], table, [class*="player"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    const players = await page.evaluate(() => {
      const data = [];

      // Try table rows first
      const rows = document.querySelectorAll('[class*="ranking-row"], [class*="standings-row"], tr, [class*="player-row"]');
      rows.forEach(row => {
        const text = row.textContent.trim();
        if (!text || (text.includes('Rank') && text.includes('Player'))) return;

        const cells = row.querySelectorAll('td, [class*="cell"], [class*="rank"], [class*="name"], [class*="points"]');
        if (cells.length < 3) return;

        const cellTexts = Array.from(cells).map(c => c.textContent.trim());
        let rank = null, name = null, country = null, points = null;

        for (const t of cellTexts) {
          const num = parseInt(t);
          if (!rank && !isNaN(num) && num > 0 && num < 500) { rank = num; continue; }
          if (!name && t.length > 3 && isNaN(parseInt(t)) && !t.match(/^[A-Z]{2,3}$/)) { name = t; continue; }
          if (!country && t.match(/^[A-Z]{2,3}$/)) { country = t; continue; }
          const pt = parseFloat(t.replace(/,/g, ''));
          if (!points && !isNaN(pt) && pt > 0) { points = pt; continue; }
        }

        if (rank && name && points) {
          data.push({ position: rank, name, country: country || '', points });
        }
      });

      // Fallback: overview-style cards
      if (data.length === 0) {
        const entries = document.querySelectorAll('a[href*="/athletes/"]');
        let currentRank = 0;
        entries.forEach(entry => {
          const parent = entry.closest('[class*="ranking"], [class*="row"], li, div');
          if (!parent) return;
          const text = parent.textContent;
          const rankMatch = text.match(/^(\d+)/);
          const pointsMatch = text.match(/([\d,]+\.\d{3})/);
          const nameEl = entry.querySelector('h2, h3, [class*="name"], strong') || entry;
          const name = nameEl.textContent.trim();
          const countryMatch = text.match(/([A-Z]{3})/);

          if (rankMatch && name && name.length > 2 && pointsMatch) {
            const rank = parseInt(rankMatch[1]);
            if (rank > currentRank || rank === currentRank) {
              currentRank = rank;
              data.push({
                position: rank,
                name: name.replace(/\s+/g, ' ').trim(),
                country: countryMatch ? countryMatch[1] : '',
                points: parseFloat(pointsMatch[1].replace(/,/g, ''))
              });
            }
          }
        });
      }

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
