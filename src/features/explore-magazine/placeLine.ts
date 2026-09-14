import i18n from '@/i18n';

/**
 * COURSE PLACE LINE — region, then NATION.
 *
 * "Kerry" alone asks the reader to know where Kerry is. Every shelf tile and
 * card meta line therefore reads region + nation: "Kerry, Ireland",
 * "Fife, Scotland", "Kent, England".
 *
 * THE NATION IS golf_courses.sub_country, NEVER country. `country` in this
 * schema is a GROUPING ("Britain & Ireland", "USA"): Royal County Down is
 * country = 'Britain & Ireland', sub_country = 'Northern Ireland',
 * region = 'Down'. "Down, Britain & Ireland" would read badly.
 *
 * WHEN REGION IS NULL the pair walks down one step — sub_country, country —
 * so Pine Valley (region null, sub_country 'New Jersey', country 'USA')
 * reads "New Jersey, USA".
 *
 * geo_regions HOLDS THE REGION VOCABULARY, NOT THE ANSWER (reported): it maps
 * region -> sub_country for 17 nations, all of them GB&I / Continental Europe /
 * ANZ / South Africa. It carries no US state, so it cannot resolve Pine Valley
 * at all, and every region it does hold is already the exact string on the
 * course row. Reading it would add a query and answer strictly less. The pair
 * is therefore built from the course row, whose region/sub_country values are
 * the same canonical vocabulary geo_regions publishes.
 *
 * THE SEPARATOR IS LOCALISED, not baked in: ja uses the ideographic comma.
 */

export interface CoursePlace {
  region?: string | null;
  subCountry?: string | null;
  country?: string | null;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function coursePlaceLine(place: CoursePlace | null | undefined): string | null {
  if (!place) return null;
  const region = clean(place.region);
  const sub = clean(place.subCountry);
  const country = clean(place.country);

  const head = region ?? sub ?? country;
  if (!head) return null;
  const tail = region ? (sub ?? country) : region ? null : sub ? country : null;
  if (!tail || tail === head) return head;

  return i18n.t('courses:amateur.place.pair', {
    defaultValue: '{{place}}, {{nation}}',
    place: head,
    nation: tail,
  });
}

export default coursePlaceLine;
