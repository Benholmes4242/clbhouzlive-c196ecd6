/**
 * Course-name matcher for WHS-reported names → golf_courses rows.
 *
 * Strategy:
 *   1. Canonicalise to a `whs_name_norm` form.
 *   2. Check the alias cache.
 *   3. Try exact match.
 *   4. Try normalised / suffix match against candidate rows.
 *   5. Try the dash-rewrite for "Foo-Bar Course" patterns.
 *   6. Try fuzzy ilike with the dash core.
 *   7. On success, persist into whs_course_aliases.
 */

import { supabase } from '@/integrations/supabase/client';

type GolfCourseLite = { id: string; name: string; thumbnail_image: string | null };
type MatchMethod = 'cache' | 'exact' | 'normalised' | 'dash' | 'suffix' | 'fuzzy';

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

export async function resolveCourseFromWhsName(
  whsName: string,
): Promise<GolfCourseLite | null> {
  if (!whsName || !whsName.trim()) return null;

  const norm = normaliseCourseName(whsName);

  // 1. Cache hit?
  const { data: aliasHit } = await supabase
    .from('whs_course_aliases')
    .select('course_id, golf_courses!whs_course_aliases_course_id_fkey(id, name, thumbnail_image)')
    .eq('whs_name_norm', norm)
    .maybeSingle();

  if (aliasHit && (aliasHit as any).golf_courses) {
    return (aliasHit as any).golf_courses as GolfCourseLite;
  }

  // 2. Exact case-insensitive match
  {
    const { data } = await supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image')
      .ilike('name', whsName.trim())
      .maybeSingle();
    if (data) {
      await persistAlias(whsName, norm, data.id, 'exact');
      return data as GolfCourseLite;
    }
  }

  // 3-4. Normalised / suffix match against candidate rows
  const baseWords = norm.split(' ').slice(0, 3).join(' ');
  if (baseWords.length >= 3) {
    const { data: candidates } = await supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image')
      .ilike('name', `%${baseWords}%`)
      .limit(20);

    if (candidates && candidates.length > 0) {
      for (const c of candidates) {
        if (normaliseCourseName(c.name) === norm) {
          await persistAlias(whsName, norm, c.id, 'normalised');
          return c as GolfCourseLite;
        }
      }
      for (const c of candidates) {
        const cNorm = normaliseCourseName(c.name);
        if (cNorm.startsWith(norm + ' ') || norm.startsWith(cNorm + ' ')) {
          await persistAlias(whsName, norm, c.id, 'suffix');
          return c as GolfCourseLite;
        }
      }
    }
  }

  // 5. Dash variants
  for (const variant of dashVariants(whsName)) {
    if (variant === whsName.trim()) continue;
    const { data } = await supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image')
      .ilike('name', variant)
      .maybeSingle();
    if (data) {
      await persistAlias(whsName, norm, data.id, 'dash');
      return data as GolfCourseLite;
    }
  }

  // 6. Fuzzy
  const dashMatch = whsName.trim().match(/^(.+?)-(.+)$/);
  if (dashMatch) {
    const [, base, suffix] = dashMatch;
    const suffixCore = suffix.replace(/\s*course\s*$/i, '').trim();
    const { data } = await supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image')
      .ilike('name', `${base.trim()}%${suffixCore}%`)
      .limit(1);
    if (data && data.length > 0) {
      await persistAlias(whsName, norm, data[0].id, 'fuzzy');
      return data[0] as GolfCourseLite;
    }
  }

  // eslint-disable-next-line no-console
  console.info('[courseNameMatcher] miss', { whsName, norm });
  return null;
}

export async function lookupCourseThumbnailV2(whsName: string): Promise<string | null> {
  const course = await resolveCourseFromWhsName(whsName);
  return course?.thumbnail_image ?? null;
}
