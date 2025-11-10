/**
 * parseTagDirective - Extract tag directive from search input
 * Supports: tag:#foo | tag:"#Deep Dive" | tag:'Long Tag'
 * Returns cleaned query + extracted tag
 */

export function extractTagDirective(input: string): { cleanQuery: string; tag?: string } {
  if (!input) return { cleanQuery: '' };
  
  // Supported: tag:#foo  | tag:"#Deep Dive" | tag:'Long Tag'
  const TAG_RE = /\btag:\s*(?:(?:"([^"]+)")|(?:'([^']+)')|#?([^\s]+))\b/gi;

  let tag: string | undefined;
  let clean = input;
  
  clean = clean.replace(TAG_RE, (_, g1, g2, g3) => {
    tag = (g1 ?? g2 ?? g3 ?? '').trim();
    return ''; // strip directive from search box text
  });

  clean = clean.replace(/\s{2,}/g, ' ').trim();
  return { cleanQuery: clean, tag: tag ? tag.toLowerCase() : undefined };
}
