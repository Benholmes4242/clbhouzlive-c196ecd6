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
const RUN_START = new Date().toISOString();

// Delete rows for a tour that this run did NOT refresh (departed players,
// renamed players). Only ever called after a successful non-zero upsert so a
// broken site can never wipe a tour's table.
async function sweepStaleRows(supabase, tourCode, seasonYear, label) {
  const { count, error } = await supabase
    .from('tour_season_rankings')
    .delete({ count: 'exact' })
    .eq('tour_code', tourCode)
    .eq('season_year', seasonYear)
    .lt('scraped_at', RUN_START);
  if (error) {
    console.error(`[${label}] Stale sweep error:`, error.message);
  } else {
    console.log(`[${label}] Swept ${count ?? 0} stale rows`);
  }
}

// Compute position_change from OUR OWN previous run.
//
// SIGN CONVENTION - single source of truth for every tour:
//     position_change = previousPosition - newPosition
//     POSITIVE = MOVED UP.
// This matches what is already deployed for DP World (Mazzoli 127 -> 39 = +88)
// and what MovementFigure renders. Never inverted, never per-tour.
//
// MUST be called BEFORE the upsert: it reads the very rows the upsert
// overwrites. If the first run after deploy produces all nulls, the call has
// been placed after the upsert.
//
// Edge cases:
//   climber   prev 40, now 9  -> "31"
//   faller    prev 5,  now 22 -> "-17"
//   static    prev 12, now 12 -> "0"   (string zero, not null)
//   new entrant / previous position null -> null (NOT "0": we cannot claim a
//                                          player "held" a place they never had)
//   dropped player -> simply absent, handled by sweepStaleRows
//
// compareOnly: leave row.position_change untouched and only report whether the
// computed value agrees with the value already on the row (used for euro,
// which still scrapes a movement cell).
async function attachMovement(supabase, tourCode, seasonYear, rows, label, opts) {
  const compareOnly = !!(opts && opts.compareOnly);

  const prev = new Map();
  const { data, error } = await supabase
    .from('tour_season_rankings')
    .select('player_name, position')
    .eq('tour_code', tourCode)
    .eq('season_year', seasonYear);

  if (error) {
    console.error(`[${label}] Previous-position read failed, movement left null:`, error.message);
  } else {
    for (const r of data || []) {
      if (r.player_name && typeof r.position === 'number') prev.set(r.player_name, r.position);
    }
    console.log(`[${label}] Read ${prev.size} previous positions`);
  }

  let computedCount = 0;
  let newEntrants = 0;
  let agree = 0;
  let disagree = 0;
  const disagreements = [];

  for (const row of rows) {
    const previous = prev.get(row.player_name);
    const computed =
      typeof previous === 'number' && typeof row.position === 'number'
        ? String(previous - row.position)
        : null;

    if (computed === null) newEntrants++;
    else computedCount++;

    if (compareOnly) {
      const scraped = row.position_change === null || row.position_change === undefined
        ? null
        : String(row.position_change).trim();
      if (computed !== null && scraped !== null && scraped !== '') {
        if (computed === scraped) agree++;
        else {
          disagree++;
          if (disagreements.length < 10) {
            disagreements.push(`${row.player_name}: scraped=${scraped} computed=${computed}`);
          }
        }
      }
    } else {
      row.position_change = computed;
    }
  }

  if (compareOnly) {
    console.log(
      `[${label}] Movement agreement check: ${agree} agree, ${disagree} disagree ` +
      `(of ${computedCount} comparable, ${newEntrants} new entrants). Scraped cell still authoritative.`
    );
    if (disagreements.length > 0) {
      console.log(`[${label}] Sample disagreements: ${disagreements.join(' | ')}`);
    }
  } else {
    console.log(
      `[${label}] Movement computed for ${computedCount} rows, ${newEntrants} new entrants left null`
    );
  }

  return rows;
}

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

    // Lazy-load exhaust: scroll (and click any load-more) until row count stops growing
    let prevCount = 0;
    for (let i = 0; i < 30; i++) {
      const count = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        const btn = [...document.querySelectorAll('button')]
          .find(b => /load more|show more/i.test(b.textContent || ''));
        if (btn) btn.click();
        return document.querySelectorAll('table tbody tr').length;
      });
      await new Promise(r => setTimeout(r, 800));
      if (count === prevCount && i > 2) break;
      prevCount = count;
    }
    console.log(`[R2D Scraper] Rows in DOM after lazy-load exhaust: ${prevCount}`);

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
            points,
            wins: 0
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

    // Dedupe by conflict key (the page can render duplicate rows)
    const seen = new Map();
    for (const p of players) {
      const key = `${TOUR_CODE}|${SEASON_YEAR}|${p.name}`;
      if (!seen.has(key)) seen.set(key, p);
    }
    const deduped = [...seen.values()];
    console.log(`[R2D Scraper] Deduped ${players.length} -> ${deduped.length}`);

    // Build rows for upsert
    const rows = deduped.map(p => ({
      player_name: p.name,
      tour_code: TOUR_CODE,
      season_year: SEASON_YEAR,
      position: p.position,
      position_change: p.position_change || null,
      points: p.points,
      tournaments_played: p.tournaments_played,
      country: p.country || null,
      wins: p.wins || 0,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Euro already scrapes a movement cell. Report whether the computed value
    // agrees before we retire the scraped one (see brief 1.4). Read happens
    // BEFORE the upsert.
    await attachMovement(supabase, TOUR_CODE, SEASON_YEAR, rows, 'R2D Scraper', { compareOnly: true });



    // Upsert in batches of 50
    let upserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from('tour_season_rankings')
        .upsert(batch, { onConflict: 'tour_code,season_year,player_name' });
      if (error) {
        console.error('[R2D Scraper] Upsert error:', error.message);
        process.exitCode = 1;
      } else {
        upserted += batch.length;
      }
    }

    console.log(`[R2D Scraper] Upserted ${upserted} players`);
    if (upserted === 0 && players.length > 0) {
      console.error('[R2D Scraper] Wrote ZERO rows despite parsing players - failing the run');
      process.exitCode = 1;
    }
    if (upserted > 0) {
      await sweepStaleRows(supabase, TOUR_CODE, SEASON_YEAR, 'R2D Scraper');
    }

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

    // Scrape Korn Ferry Tour Points List
    await scrapeKornFerry(browser, supabase);

    // Scrape LIV Golf Individual Standings
    await scrapeLIV(browser, supabase);

    // Populate wins from tournament results data
    console.log('[R2D Scraper] Populating wins from tournament results...');
    const { error: winsError } = await supabase.rpc('populate_tour_ranking_wins');
    if (winsError) {
      console.error('[R2D Scraper] Failed to populate wins:', winsError.message);
    } else {
      console.log('[R2D Scraper] Wins populated successfully');
    }

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

        // EVENTS and WINS are on the page and were previously ignored.
        // Row reads: RANK | movement | ATHLETE | CTY | CME POINTS | POINTS
        // BEHIND | EVENTS | WINS | TOP 10S | PROJECTED POINTS | PROJECTED RANK
        // Anchor on the CME points cell (3 decimal places), skip POINTS BEHIND
        // (also 3dp), then read the two plain integers that follow.
        let events = null;
        let wins = null;
        const lines = (row.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
        const anchor = lines.findIndex(v => /^[\d,]+\.\d{3}$/.test(v));
        if (anchor !== -1 && /^[\d,]+\.\d{3}$/.test(lines[anchor + 1] || '')) {
          const ev = lines[anchor + 2];
          const wn = lines[anchor + 3];
          if (/^\d{1,2}$/.test(ev || '')) {
            const n = parseInt(ev, 10);
            if (n >= 0 && n <= 60) events = n;
          }
          if (/^\d{1,2}$/.test(wn || '')) {
            const n = parseInt(wn, 10);
            if (n >= 0 && n <= 30) wins = n;
          }
        }

        if (rank && name && points !== null) {
          seen.add(name);
          data.push({ position: rank, name, country, points, events, wins });
        }

      });

      data.sort((a, b) => a.position - b.position || b.points - a.points);
      return data;
    });

    console.log(`[LPGA Scraper] Parsed ${players.length} players`);
    console.log(
      `[LPGA Scraper] Events read on ${players.filter(p => p.events !== null).length}, ` +
      `wins read on ${players.filter(p => p.wins !== null).length} of ${players.length}`
    );

    if (players.length === 0) {
      console.log('[LPGA Scraper] No players parsed — HTML structure may have changed, skipping');
      return;
    }

    const rows = players.map(p => ({
      player_name: p.name,
      tour_code: LPGA_TOUR_CODE,
      season_year: LPGA_SEASON_YEAR,
      position: p.position,
      position_change: null,
      points: p.points,
      tournaments_played: p.events !== null && p.events !== undefined ? p.events : null,
      country: p.country || null,
      wins: p.wins !== null && p.wins !== undefined ? p.wins : 0,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // BEFORE the upsert - reads last run's positions.
    await attachMovement(supabase, LPGA_TOUR_CODE, LPGA_SEASON_YEAR, rows, 'LPGA Scraper');



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
    if (upserted > 0) {
      await sweepStaleRows(supabase, LPGA_TOUR_CODE, LPGA_SEASON_YEAR, 'LPGA Scraper');
    }

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

async function scrapeKornFerry(browser, supabase) {
  const KFT_URL = 'https://www.pgatour.com/korn-ferry-tour/pointslist';
  const KFT_TOUR_CODE = 'pgad';
  const now = new Date();
  const KFT_SEASON_YEAR = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();

  console.log(`[KFT Scraper] Starting for season ${KFT_SEASON_YEAR}...`);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    await page.goto(KFT_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    // Wait for the standings table to render
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('tr');
      return rows.length > 10;
    }, { timeout: 20000 });

    // Click "Official" button if it exists
    try {
      const officialBtn = await page.$('button:has-text("Official"), [class*="Official"]');
      if (officialBtn) {
        await officialBtn.click();
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      // Official tab may already be selected or not exist
    }

    await new Promise(r => setTimeout(r, 3000));

    const players = await page.evaluate(() => {
      const data = [];
      const seen = new Set();
      const rows = document.querySelectorAll('tr');

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;

        const cellTexts = Array.from(cells).map(c => c.textContent.trim());

        let name = null;
        let rank = null;
        let points = null;

        // First cell or text that looks like a rank
        for (const t of cellTexts) {
          const rankMatch = t.match(/^T?(\d+)$/);
          if (!rank && rankMatch && parseInt(rankMatch[1]) > 0 && parseInt(rankMatch[1]) < 500) {
            rank = parseInt(rankMatch[1]);
            break;
          }
        }

        // Find name: cell with alphabetic text longer than 3 chars
        for (const t of cellTexts) {
          if (!name && t.length > 3 && /^[A-Za-z\s\.\-\']+$/.test(t) && !/^\d/.test(t)) {
            name = t.trim();
            break;
          }
        }

        // Find points: number with 3 decimal places, search from right
        for (let i = cellTexts.length - 1; i >= 0; i--) {
          const match = cellTexts[i].replace(/,/g, '').match(/^(\d+\.\d{3})$/);
          if (match && !points) {
            points = parseFloat(match[1]);
          }
        }

        // Fallback: any decimal number
        if (!points) {
          for (let i = cellTexts.length - 1; i >= 0; i--) {
            const num = parseFloat(cellTexts[i].replace(/,/g, ''));
            if (!isNaN(num) && num > 0 && cellTexts[i].includes('.')) {
              points = num;
              break;
            }
          }
        }

        if (rank && name && points && !seen.has(name)) {
          seen.add(name);
          data.push({ position: rank, name, points });
        }
      });

      data.sort((a, b) => a.position - b.position || b.points - a.points);
      return data;
    });

    console.log(`[KFT Scraper] Parsed ${players.length} players`);

    if (players.length === 0) {
      console.log('[KFT Scraper] No players parsed — HTML structure may have changed, skipping');
      return;
    }

    const rows = players.map(p => ({
      player_name: p.name,
      tour_code: KFT_TOUR_CODE,
      season_year: KFT_SEASON_YEAR,
      position: p.position,
      points: p.points,
      tournaments_played: null,
      country: null,
      wins: 0,
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
        console.error('[KFT Scraper] Upsert error:', error.message);
      } else {
        upserted += batch.length;
      }
    }
    console.log(`[KFT Scraper] Upserted ${upserted} players`);
    if (upserted > 0) {
      await sweepStaleRows(supabase, KFT_TOUR_CODE, KFT_SEASON_YEAR, 'KFT Scraper');
    }

    // Match players to sr_players
    const { data: kftPlayers } = await supabase
      .from('sr_players')
      .select('id, full_name, last_name, first_name')
      .contains('tour_codes', ['PGAD']);

    if (kftPlayers && kftPlayers.length > 0) {
      let matched = 0;
      for (const row of rows) {
        if (!row.player_name) continue;
        const match = kftPlayers.find(p => {
          const fullUpper = p.full_name?.toUpperCase();
          const scraped = row.player_name.toUpperCase();
          return fullUpper === scraped ||
                 fullUpper === scraped.replace(/\s+/g, ' ').trim();
        });
        const match2 = !match ? kftPlayers.find(p => {
          const combined = (p.first_name + ' ' + p.last_name).toUpperCase();
          return combined === row.player_name.toUpperCase();
        }) : null;

        const finalMatch = match || match2;
        if (finalMatch) {
          await supabase
            .from('tour_season_rankings')
            .update({ player_id: finalMatch.id })
            .eq('tour_code', KFT_TOUR_CODE)
            .eq('season_year', KFT_SEASON_YEAR)
            .eq('player_name', row.player_name);
          matched++;
        }
      }
      console.log(`[KFT Scraper] Matched ${matched} of ${rows.length} players`);
    }

  } catch (err) {
    console.error('[KFT Scraper] Error:', err.message);
  } finally {
    await page.close();
  }
}

async function scrapeLIV(browser, supabase) {
  const LIV_URL = 'https://www.livgolf.com/standings';
  const LIV_TOUR_CODE = 'liv';
  const now = new Date();
  const LIV_SEASON_YEAR = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();

  console.log(`[LIV Scraper] Starting for season ${LIV_SEASON_YEAR}...`);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    await page.goto(LIV_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 3000));

    // Click "Players" tab (default might be Teams)
    try {
      const playersBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"], a'));
        return buttons.find(b => b.textContent.trim() === 'Players');
      });
      if (playersBtn) {
        await playersBtn.click();
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (e) {
      console.log('[LIV Scraper] Players tab click attempt:', e.message);
    }

    // Wait for player data to render
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('LOCK ZONE') || text.includes('Jon Rahm') || text.includes('226');
    }, { timeout: 15000 });

    await new Promise(r => setTimeout(r, 2000));

    const players = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const data = [];
      const seen = new Set();

      for (let i = 0; i < lines.length; i++) {
        const posMatch = lines[i].match(/^(\d{1,2})$/);
        if (posMatch && parseInt(posMatch[1]) >= 1 && parseInt(posMatch[1]) <= 60) {
          const pos = parseInt(posMatch[1]);
          let firstName = '', lastName = '', points = 0;

          // Look ahead for points (number with 2 decimal places)
          for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
            const ptMatch = lines[j].match(/^(\d+\.\d{2})$/);
            if (ptMatch) { points = parseFloat(ptMatch[1]); break; }
          }

          // Name is next 2 lines after position
          if (i + 1 < lines.length) firstName = lines[i + 1];
          if (i + 2 < lines.length) lastName = lines[i + 2];

          if (firstName && lastName && points) {
            // Skip "C" captain markers
            const cleanLast = lastName === 'C' ? lines[i + 3] : lastName;
            const name = firstName + ' ' + cleanLast;
            if (!seen.has(name) && !name.includes('POS') && !name.includes('Player')) {
              seen.add(name);
              data.push({ position: pos, name, points });
            }
          }
        }
      }

      data.sort((a, b) => a.position - b.position);
      return data;
    });

    console.log(`[LIV Scraper] Parsed ${players.length} players`);

    // Clean the parse: the standings page renders players on two surfaces -
    // a main list with the TEAM NAME appended ("Jon Rahm Legion XIII") and an
    // ordinal strip whose "1ST/2ND/3RD" splits into junk fragments
    // ("ST J. Rahm"). Strip team suffixes, drop ordinal fragments, dedupe.
    const LIV_TEAMS = [
      'Legion XIII', 'Crushers GC', 'Torque GC', '4Aces GC', 'Ripper GC',
      'Fireballs GC', 'Stinger GC', 'Smash GC', 'RangeGoats GC',
      'HyFlyers GC', 'Iron Heads GC', 'Cleeks GC', 'Majesticks GC'
    ];
    const seenClean = new Set();
    const cleaned = [];
    for (const p of players) {
      let name = p.name.trim().replace(/\s+/g, ' ');
      // Ordinal fragments: "ST J. Rahm" (from 1ST), "ND B. DeChambeau" (2ND), "RD ..." (3RD), "TH ..." (4TH+)
      if (/^(ST|ND|RD|TH)\s/i.test(name)) continue;
      for (const t of LIV_TEAMS) {
        if (name.toUpperCase().endsWith(' ' + t.toUpperCase())) {
          name = name.slice(0, name.length - t.length - 1).trim();
          break;
        }
      }
      if (!name || name.length < 3) continue;
      const key = name.toUpperCase();
      if (seenClean.has(key)) continue;
      seenClean.add(key);
      cleaned.push({ ...p, name });
    }
    console.log(`[LIV Scraper] Cleaned ${players.length} -> ${cleaned.length} players`);

    if (cleaned.length === 0) {
      console.log('[LIV Scraper] No players after cleaning — skipping');
      return;
    }

    const rows = cleaned.map(p => ({
      player_name: p.name,
      tour_code: LIV_TOUR_CODE,
      season_year: LIV_SEASON_YEAR,
      position: p.position,
      points: p.points,
      tournaments_played: null,
      country: null,
      wins: 0,
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
        console.error('[LIV Scraper] Upsert error:', error.message);
      } else {
        upserted += batch.length;
      }
    }
    console.log(`[LIV Scraper] Upserted ${upserted} players`);
    if (upserted > 0) {
      await sweepStaleRows(supabase, LIV_TOUR_CODE, LIV_SEASON_YEAR, 'LIV Scraper');
    }

    // Match to sr_players
    const { data: livPlayers } = await supabase
      .from('sr_players')
      .select('id, full_name, last_name, first_name')
      .contains('tour_codes', ['LIV']);

    if (livPlayers && livPlayers.length > 0) {
      let matched = 0;
      for (const row of rows) {
        if (!row.player_name) continue;
        const scraped = row.player_name.toUpperCase();
        const match = livPlayers.find(p => {
          const fullUpper = p.full_name?.toUpperCase();
          return fullUpper === scraped;
        });
        const match2 = !match ? livPlayers.find(p => {
          const combined = (p.first_name + ' ' + p.last_name).toUpperCase();
          return combined === scraped;
        }) : null;
        const match3 = (!match && !match2) ? livPlayers.find(p => {
          return p.last_name?.toUpperCase() === scraped.split(' ').pop() &&
                 p.first_name?.toUpperCase().startsWith(scraped.split(' ')[0][0]);
        }) : null;

        const finalMatch = match || match2 || match3;
        if (finalMatch) {
          await supabase
            .from('tour_season_rankings')
            .update({ player_id: finalMatch.id })
            .eq('tour_code', LIV_TOUR_CODE)
            .eq('season_year', LIV_SEASON_YEAR)
            .eq('player_name', row.player_name);
          matched++;
        }
      }
      console.log(`[LIV Scraper] Matched ${matched} of ${rows.length} players`);
    }

  } catch (err) {
    console.error('[LIV Scraper] Error:', err.message);
  } finally {
    await page.close();
  }
}

scrape().catch(err => {
  console.error('[R2D Scraper] Fatal error:', err);
  process.exit(1);
});
