export function buildEyebrow(
  type?: string | null,
  region?: string | null,
  country?: string | null,
): string {
  const t = (type ?? '').trim();
  const r = (region ?? '').trim();
  const c = (country ?? '').trim();
  if (t && c) return `${t.toUpperCase()} · ${c.toUpperCase()}`;
  if (r && c) return `${r.toUpperCase()} · ${c.toUpperCase()}`;
  if (c) return c.toUpperCase();
  return '';
}
