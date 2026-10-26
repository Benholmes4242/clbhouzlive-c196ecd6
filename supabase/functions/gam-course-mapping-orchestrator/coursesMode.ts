// 'courses' mode (BRIEF_COURSE_MAPPING_ON_SYNC). Pure helpers, no imports,
// so they are unit-tested under vitest.

export const COURSES_MODE_MAX_IDS = 25;

export function parseCoursesBody(body: any): { ok: true; ids: string[] } | { ok: false; error: string } {
  const raw = body?.whs_course_ids;
  if (!Array.isArray(raw) || raw.some((v) => typeof v !== 'string' || !v)) return { ok: false, error: 'whs_course_ids must be a string array' };
  const ids = [...new Set(raw as string[])];
  if (ids.length > COURSES_MODE_MAX_IDS) return { ok: false, error: `at most ${COURSES_MODE_MAX_IDS} whs_course_ids` };
  return { ok: true, ids };
}

/** Only ids with NO map row at all; any map row (mapped or failed) is skipped. */
export function neverProcessed(ids: string[], mapRowIds: Iterable<string>): string[] {
  const seen = new Set(mapRowIds);
  return ids.filter((id) => !seen.has(id)).slice(0, COURSES_MODE_MAX_IDS);
}
