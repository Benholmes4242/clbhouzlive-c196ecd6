/**
 * Course-name matcher for WHS-reported names → golf_courses rows.
 *
 * COUNTRY GATE (Ben, Sep 2026): the candidate set is filtered by country BEFORE any
 * name comparison can win. A cross-country candidate is unselectable no matter how
 * well the strings match - that ordering is the whole fix. The old step 7 country
 * predicate inside `match_whs_course_to_golf_course` was always pre-empted by an
 * earlier name step, which is how "Centurion Club" (England) became a perfect
 * normalised match for Centurion Country Club in South Africa.
 *
 * The gate reads `golf_courses.sub_country` (never `country`, which is a region
 * grouping) and is built on the WHS `country_name` (never `country_code`, which mixes
 * three schemes). See `countryVocabulary.ts` for the vocabulary and the fail-closed
 * rules. When a caller supplies no country at all the gate cannot run and legacy
 * behaviour is preserved.
 *
 * Strategy:
 *   1. Canonicalise to a `whs_name_norm` form.
 *   2. Check the alias cache (country-verified).
 *   3. Try exact match.
 *   4. Try normalised / suffix match against candidate rows.
 *   5. Try the dash-rewrite for "Foo-Bar Course" patterns.
 *   6. Try fuzzy ilike with the dash core.
 *   7. Server-side RPC fallback (country-verified on the way out).
 *   8. On success, persist into whs_course_aliases.
 */

import { supabase } from '@/integrations/supabase/client';
import { makeCountryGate, whsCountryNameFromCode, type CountryGate } from './countryVocabulary';

type GolfCourseLite = {
  id: string;
  name: string;
  thumbnail_image: string | null;
  region: string | null;
};
type CandidateRow = GolfCourseLite & { sub_country?: string | null };
type MatchMethod = 'cache' | 'exact' | 'normalised' | 'dash' | 'suffix' | 'fuzzy' | 'rpc';

/** Every candidate read carries sub_country so the gate can judge it. */
const CANDIDATE_SELECT = 'id, name, thumbnail_image, region, sub_country';

const COMMON_SUFFIXES = [
  'golf and country club',
  'golf & country club',
  'golf club',
  'country club',
  'golf course',
  'golf links',
  'links golf club',
  'links',
  'club',
];

export function normaliseCourseName(input: string): string {
  let s = input.trim().toLowerCase();

  s = s.replace(/\s*&\s*/g, ' and ');
  s = s.replace(/['’`]/g, '');
  s = s.replace(/^the\s+/, '');

  for (const suffix of COMMON_SUFFIXES) {
    const normSuffix = suffix.replace(/&/g, 'and');
    const escaped = normSuffix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(`\\s+${escaped}$`);
    if (re.test(s)) {
      s = s.replace(re, '');
      break;
    }
  }

  s = s.replace(/[^a-z0-9\s()]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

function dashVariants(name: string): string[] {
  const variants = new Set<string>();
  const trimmed = name.trim();
  variants.add(trimmed);

  const dashMatch = trimmed.match(/^(.+?)-(.+)$/);
  if (dashMatch) {
    const [, base, suffix] = dashMatch;
    variants.add(`${base.trim()} (${suffix.trim()})`);
    const suffixNoCourse = suffix.replace(/\s*course\s*$/i, '').trim();
    if (suffixNoCourse) variants.add(`${base.trim()} (${suffixNoCourse})`);
  }

  return Array.from(variants);
}

async function persistAlias(
  whsName: string,
  whsNameNorm: string,
  courseId: string,
  method: MatchMethod,
): Promise<void> {
  if (method === 'cache') return;
  try {
    await supabase.rpc('upsert_whs_course_alias', {
      p_whs_name: whsName,
      p_whs_name_norm: whsNameNorm,
      p_course_id: courseId,
      p_match_method: method,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[courseNameMatcher] persistAlias failed', err);
  }
}

/** Narrow a query to the allowed sub_country values when the gate is active. */
function scopeToCountry<T>(query: T, gate: CountryGate): T {
  if (!gate.active) return query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).in('sub_country', gate.allowed as string[]) as T;
}

function rejected(gate: CountryGate, whsName: string, candidate: CandidateRow, step: string) {
  // eslint-disable-next-line no-console
  console.info('[courseNameMatcher] country gate rejected candidate', {
    whsName,
    whsCountry: gate.whsCountryName,
    candidate: candidate.name,
    candidateSubCountry: candidate.sub_country ?? null,
    step,
  });
}

function strip(row: CandidateRow): GolfCourseLite {
  return {
    id: row.id,
    name: row.name,
    thumbnail_image: row.thumbnail_image,
    region: row.region,
  };
}

export async function resolveCourseFromWhsName(
  whsName: string,
  countryCode?: string | null,
  countryName?: string | null,
): Promise<GolfCourseLite | null> {
  if (!whsName || !whsName.trim()) return null;

  // country_name is authoritative; the code is only a bridge for legacy callers.
  const whsCountry = countryName?.trim() || whsCountryNameFromCode(countryCode);
  const gate = makeCountryGate(whsCountry);

  // Supplied but unrecognised country, or a country with no allowed targets: reject
  // outright rather than let a name step win. Fail closed.
  if (gate.active && gate.allowed.length === 0) {
    // eslint-disable-next-line no-console
    console.info('[courseNameMatcher] unknown WHS country - failing closed', {
      whsName,
      whsCountry: gate.whsCountryName,
      countryCode: countryCode ?? null,
    });
    return null;
  }

  const norm = normaliseCourseName(whsName);

  // 1. Cache hit? Still country-verified: the alias table holds rows that predate
  //    the gate, at least 14 of which cross a border.
  const { data: aliasHit } = await supabase
    .from('whs_course_aliases')
    .select(
      'course_id, golf_courses!whs_course_aliases_course_id_fkey(id, name, thumbnail_image, region, sub_country)',
    )
    .eq('whs_name_norm', norm)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = (aliasHit as any)?.golf_courses as CandidateRow | undefined;
  if (cached) {
    if (gate.allows(cached.sub_country)) return strip(cached);
    rejected(gate, whsName, cached, 'cache');
  }

  // 2. Exact case-insensitive match
  {
    const { data } = await scopeToCountry(
      supabase.from('golf_courses').select(CANDIDATE_SELECT).ilike('name', whsName.trim()),
      gate,
    ).limit(1);
    const hit = (data ?? [])[0] as CandidateRow | undefined;
    if (hit && gate.allows(hit.sub_country)) {
      await persistAlias(whsName, norm, hit.id, 'exact');
      return strip(hit);
    }
  }

  // 3-4. Normalised / suffix match against candidate rows
  const baseWords = norm.split(' ').slice(0, 3).join(' ');
  if (baseWords.length >= 3) {
    const { data: candidates } = await scopeToCountry(
      supabase.from('golf_courses').select(CANDIDATE_SELECT).ilike('name', `%${baseWords}%`),
      gate,
    ).limit(20);

    const rows = ((candidates ?? []) as CandidateRow[]).filter((c) => {
      if (gate.allows(c.sub_country)) return true;
      rejected(gate, whsName, c, 'normalised/suffix');
      return false;
    });

    if (rows.length > 0) {
      for (const c of rows) {
        if (normaliseCourseName(c.name) === norm) {
          await persistAlias(whsName, norm, c.id, 'normalised');
          return strip(c);
        }
      }
      for (const c of rows) {
        const cNorm = normaliseCourseName(c.name);
        if (cNorm.startsWith(norm + ' ') || norm.startsWith(cNorm + ' ')) {
          await persistAlias(whsName, norm, c.id, 'suffix');
          return strip(c);
        }
      }
    }
  }

  // 5. Dash variants
  for (const variant of dashVariants(whsName)) {
    if (variant === whsName.trim()) continue;
    const { data } = await scopeToCountry(
      supabase.from('golf_courses').select(CANDIDATE_SELECT).ilike('name', variant),
      gate,
    ).limit(1);
    const hit = (data ?? [])[0] as CandidateRow | undefined;
    if (hit && gate.allows(hit.sub_country)) {
      await persistAlias(whsName, norm, hit.id, 'dash');
      return strip(hit);
    }
  }

  // 6. Fuzzy
  const dashMatch = whsName.trim().match(/^(.+?)-(.+)$/);
  if (dashMatch) {
    const [, base, suffix] = dashMatch;
    const suffixCore = suffix.replace(/\s*course\s*$/i, '').trim();
    const { data } = await scopeToCountry(
      supabase
        .from('golf_courses')
        .select(CANDIDATE_SELECT)
        .ilike('name', `${base.trim()}%${suffixCore}%`),
      gate,
    ).limit(1);
    const hit = (data ?? [])[0] as CandidateRow | undefined;
    if (hit && gate.allows(hit.sub_country)) {
      await persistAlias(whsName, norm, hit.id, 'fuzzy');
      return strip(hit);
    }
  }

  // 7. Server-side RPC fallback (apostrophe-tolerant + pg_trgm fuzzy + country-filtered)
  try {
    const rpcParams: { p_whs_name: string; p_country_code?: string } = {
      p_whs_name: whsName.trim(),
    };
    if (countryCode && countryCode.trim().length > 0) {
      rpcParams.p_country_code = countryCode.trim();
    }
    const { data: rpcMatch, error: rpcErr } = await supabase
      .rpc('match_whs_course_to_golf_course', rpcParams as any);
    if (!rpcErr && rpcMatch && Array.isArray(rpcMatch) && rpcMatch.length > 0) {
      const row = rpcMatch[0] as { id: string; name: string; thumbnail_image: string | null; region: string | null };
      // The RPC's own country predicate sits behind its name steps, so verify here.
      let subCountry: string | null = null;
      if (gate.active) {
        const { data: verify } = await supabase
          .from('golf_courses')
          .select('sub_country')
          .eq('id', row.id)
          .maybeSingle();
        subCountry = (verify as { sub_country: string | null } | null)?.sub_country ?? null;
      }
      const candidate: CandidateRow = { ...row, sub_country: subCountry };
      if (gate.allows(subCountry)) {
        await persistAlias(whsName, norm, row.id, 'rpc');
        return strip(candidate);
      }
      rejected(gate, whsName, candidate, 'rpc');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[courseNameMatcher] rpc fallback errored', err);
  }

  // eslint-disable-next-line no-console
  console.info('[courseNameMatcher] miss', { whsName, norm, whsCountry: gate.whsCountryName });
  return null;
}

export async function lookupCourseThumbnailV2(
  whsName: string,
  countryCode?: string | null,
  countryName?: string | null,
): Promise<string | null> {
  const course = await resolveCourseFromWhsName(whsName, countryCode, countryName);
  return course?.thumbnail_image ?? null;
}

/** Returns `{ thumbnail_image, region }` from the matched `golf_courses` row.
 *  Used by `fetchCourseForm` so we don't re-resolve the course twice (once for thumb,
 *  once for region). Null on miss. */
export async function lookupCourseMetaV2(
  whsName: string,
  countryCode?: string | null,
  countryName?: string | null,
): Promise<{ thumbnail_image: string | null; region: string | null } | null> {
  const course = await resolveCourseFromWhsName(whsName, countryCode, countryName);
  if (!course) return null;
  return { thumbnail_image: course.thumbnail_image, region: course.region };
}

/** Resolve a WHS-reported course name to an internal `golf_courses.id`.
 *  Thin wrapper over the same alias matcher used for thumbnails/region. */
export async function lookupCourseId(
  whsName: string,
  countryCode?: string | null,
  countryName?: string | null,
): Promise<string | null> {
  const course = await resolveCourseFromWhsName(whsName, countryCode ?? null, countryName ?? null);
  return course?.id ?? null;
}
