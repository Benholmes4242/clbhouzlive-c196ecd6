/** The full course region line ("Surrey, Britain & Ireland"), shared by the
 * feed review card and the feed post card: the first present of region /
 * sub-country, then the country, de-duplicated (case-insensitive) and joined
 * with ", ". Empty parts drop; nothing is invented. */
export interface RegionParts {
  region?: string | null;
  subCountry?: string | null;
  country?: string | null;
}

export function formatRegionLine({ region, subCountry, country }: RegionParts): string {
  const first = [region, subCountry].map((v) => v?.trim()).find(Boolean) ?? '';
  const out: string[] = [];
  for (const part of [first, country?.trim() ?? '']) {
    if (part && !out.some((p) => p.toLowerCase() === part.toLowerCase())) out.push(part);
  }
  return out.join(', ');
}
