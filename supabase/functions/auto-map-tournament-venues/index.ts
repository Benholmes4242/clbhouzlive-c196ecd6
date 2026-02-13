import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Expand common golf venue abbreviations to full names for matching.
 */
function expandAbbreviations(name: string): string {
  return name
    .replace(/\bG\s*&\s*CC\b/gi, 'Golf & Country Club')
    .replace(/\bGCC\b/gi, 'Golf & Country Club')
    .replace(/\bCC\b/gi, 'Country Club')
    .replace(/\bGC\b/gi, 'Golf Club')
    .replace(/\bG&CC\b/gi, 'Golf & Country Club')
    .trim()
}

/**
 * Strip common suffixes to get the core venue name for fuzzy matching.
 */
function stripSuffixes(name: string): string {
  return name
    .replace(/\s+(Resort\s+and\s+Spa|Resort\s*&\s*Spa|Resort|and\s+Spa|& Spa)\s*$/gi, '')
    .replace(/\s+(Golf Club|Golf Course|Country Club|Golf & Country Club|CC|GC|GCC|G&CC)\s*$/gi, '')
    .replace(/\bThe\s+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize country names/codes for comparison.
 */
function normalizeCountry(c: string | null): string {
  if (!c) return ''
  const mapped: Record<string, string> = {
    'usa': 'united states',
    'us': 'united states',
    'united states of america': 'united states',
    'uk': 'united kingdom',
    'great britain': 'united kingdom',
    'england': 'united kingdom',
    'scotland': 'united kingdom',
    'wales': 'united kingdom',
    'northern ireland': 'united kingdom',
    'uae': 'united arab emirates',
  }
  const lower = c.toLowerCase().trim()
  return mapped[lower] || lower
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Find all unmapped tournaments
    const { data: unmapped, error: unmappedErr } = await supabase
      .from('sr_tournaments')
      .select('venue_name, venue_city, venue_country')
      .not('venue_name', 'is', null)

    if (unmappedErr) throw unmappedErr

    // Get existing mappings to filter
    const { data: existing, error: existErr } = await supabase
      .from('sr_course_map')
      .select('sr_venue_name')

    if (existErr) throw existErr

    const mappedNames = new Set((existing || []).map((r: any) => r.sr_venue_name))
    const toMap = (unmapped || []).filter((t: any) => !mappedNames.has(t.venue_name))

    // Dedupe by venue_name
    const uniqueVenues = new Map<string, { venue_name: string; venue_city: string | null; venue_country: string | null }>()
    for (const t of toMap) {
      if (t.venue_name && !uniqueVenues.has(t.venue_name)) {
        uniqueVenues.set(t.venue_name, t)
      }
    }

    console.log(`[auto-map] Found ${uniqueVenues.size} unmapped venue(s) to process`)

    let mapped = 0
    let skipped = 0
    const unmappedNames: string[] = []

    for (const [venueName, venue] of uniqueVenues) {
      const expandedName = expandAbbreviations(venueName)
      const coreName = stripSuffixes(expandedName)
      const venueCountryNorm = normalizeCountry(venue.venue_country)

      let matchedCourseId: string | null = null
      let confidence = 0
      let matchType = ''

      // --- TIER A: Exact match ---
      const { data: exact } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .eq('name', venueName)
        .not('thumbnail_image', 'is', null)
        .limit(1)
        .maybeSingle()

      if (exact) {
        matchedCourseId = exact.id
        confidence = 1.0
        matchType = 'exact'
      }

      // --- TIER B: Exact match on expanded name ---
      if (!matchedCourseId && expandedName !== venueName) {
        const { data: expandedMatch } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image')
          .eq('name', expandedName)
          .not('thumbnail_image', 'is', null)
          .limit(1)
          .maybeSingle()

        if (expandedMatch) {
          matchedCourseId = expandedMatch.id
          confidence = 0.95
          matchType = 'expanded-exact'
        }
      }

      // --- TIER C: Starts-with match ---
      if (!matchedCourseId) {
        const { data: startsWithMatches } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image, club_id')
          .ilike('name', `${venueName}%`)
          .not('thumbnail_image', 'is', null)
          .limit(10)

        if (startsWithMatches && startsWithMatches.length > 0) {
          // Prefer match in same country if we have country info
          if (venueCountryNorm && startsWithMatches.length > 1) {
            const clubIds = startsWithMatches.map((c: any) => c.club_id).filter(Boolean)
            if (clubIds.length > 0) {
              const { data: clubs } = await supabase
                .from('golf_clubs')
                .select('id, country')
                .in('id', clubIds)

              const clubCountryMap = new Map((clubs || []).map((c: any) => [c.id, normalizeCountry(c.country)]))

              const sameCountry = startsWithMatches.find((c: any) =>
                c.club_id && clubCountryMap.get(c.club_id) === venueCountryNorm
              )

              if (sameCountry) {
                matchedCourseId = sameCountry.id
                confidence = 0.9
                matchType = 'starts-with+country'
              }
            }
          }

          if (!matchedCourseId) {
            // Take shortest name match (most specific)
            const sorted = startsWithMatches.sort((a: any, b: any) => a.name.length - b.name.length)
            matchedCourseId = sorted[0].id
            confidence = 0.85
            matchType = 'starts-with'
          }
        }
      }

      // --- TIER D: Expanded starts-with match ---
      if (!matchedCourseId && expandedName !== venueName) {
        const { data: expStartsMatch } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image')
          .ilike('name', `${expandedName}%`)
          .not('thumbnail_image', 'is', null)
          .limit(5)

        if (expStartsMatch && expStartsMatch.length > 0) {
          const sorted = expStartsMatch.sort((a: any, b: any) => a.name.length - b.name.length)
          matchedCourseId = sorted[0].id
          confidence = 0.8
          matchType = 'expanded-starts-with'
        }
      }

      // --- TIER E: Contains core name + same country ---
      if (!matchedCourseId && coreName.length >= 4) {
        const { data: containsMatches } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image, club_id')
          .ilike('name', `%${coreName}%`)
          .not('thumbnail_image', 'is', null)
          .limit(20)

        if (containsMatches && containsMatches.length > 0 && venueCountryNorm) {
          const clubIds = containsMatches.map((c: any) => c.club_id).filter(Boolean)
          if (clubIds.length > 0) {
            const { data: clubs } = await supabase
              .from('golf_clubs')
              .select('id, country')
              .in('id', clubIds)

            const clubCountryMap = new Map((clubs || []).map((c: any) => [c.id, normalizeCountry(c.country)]))

            const sameCountry = containsMatches.filter((c: any) =>
              c.club_id && clubCountryMap.get(c.club_id) === venueCountryNorm
            )

            if (sameCountry.length === 1) {
              matchedCourseId = sameCountry[0].id
              confidence = 0.7
              matchType = 'contains+country'
            } else if (sameCountry.length > 1) {
              // Take shortest name (most specific)
              const sorted = sameCountry.sort((a: any, b: any) => a.name.length - b.name.length)
              matchedCourseId = sorted[0].id
              confidence = 0.6
              matchType = 'contains+country-multi'
            }
          }
        }
      }

      // Insert if confidence >= 0.6
      if (matchedCourseId && confidence >= 0.6) {
        const { error: insertErr } = await supabase
          .from('sr_course_map')
          .insert({
            sr_venue_name: venueName,
            sr_venue_course_name: null,
            sr_city: venue.venue_city,
            sr_country: venue.venue_country,
            golf_course_id: matchedCourseId,
            confidence,
            source: confidence >= 0.95 ? 'exact' : 'fuzzy',
          })
          // ON CONFLICT DO NOTHING handled by unique constraint
          .select()

        if (insertErr) {
          // Likely duplicate — skip
          console.log(`[auto-map] Skip insert for "${venueName}": ${insertErr.message}`)
          skipped++
        } else {
          console.log(`[auto-map] ✅ Mapped "${venueName}" → course ${matchedCourseId} (${matchType}, confidence: ${confidence})`)
          mapped++
        }
      } else {
        console.log(`[auto-map] ❌ No match for "${venueName}" (city: ${venue.venue_city}, country: ${venue.venue_country})`)
        unmappedNames.push(venueName)
        skipped++
      }
    }

    const result = { mapped, skipped, unmapped: unmappedNames, total_processed: uniqueVenues.size }
    console.log(`[auto-map] Complete:`, JSON.stringify(result))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[auto-map] Error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
