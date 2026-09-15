/**
 * BRIEF_ROUND_SHEET_TALL §2 — ONE ITEM, ONE CARD.
 *
 * The console carried "Encountered two children with the same key,
 * round:32f81139-..." from ExploreMagazine: the same stream item was in `ranked`
 * twice, which breaks React reconciliation and every map keyed by item.id —
 * cardRefs (revealCard could scroll to the wrong copy), the ring (two cards
 * ringed) and roundSeq (paging landing on the same round twice).
 *
 * The merge is the only place a duplicate can enter on the client: pages are
 * flattened with no identity check, so two overlapping keyset pages from
 * get_explore_stream put one row on the page twice. This dedupes by id with the
 * FIRST occurrence winning, which keeps the ranked order exactly as served, and
 * reports what it dropped in DEV so the cursor overlap stays visible instead of
 * being quietly swallowed.
 */

export interface IdentifiedItem {
  id: string;
}

export interface DedupeDrop {
  id: string;
  /** Page the surviving copy came from, and its position within that page. */
  keptPage: number;
  keptPos: number;
  /** Page the dropped copy came from, and its position within that page. */
  dropPage: number;
  dropPos: number;
}

export interface DedupeResult<T> {
  items: T[];
  drops: DedupeDrop[];
}

/** Flattens pages, dropping any id already seen. First occurrence wins. */
export function dedupePages<T extends IdentifiedItem>(pages: T[][]): DedupeResult<T> {
  const items: T[] = [];
  const drops: DedupeDrop[] = [];
  const at = new Map<string, { page: number; pos: number }>();
  pages.forEach((page, pageIx) => {
    page.forEach((item, pos) => {
      const seen = at.get(item.id);
      if (seen) {
        drops.push({
          id: item.id, keptPage: seen.page, keptPos: seen.pos, dropPage: pageIx, dropPos: pos,
        });
        return;
      }
      at.set(item.id, { page: pageIx, pos });
      items.push(item);
    });
  });
  return { items, drops };
}

/** The same rule for an already-flat list (defence in depth, one page). */
export function dedupeItems<T extends IdentifiedItem>(list: T[]): DedupeResult<T> {
  return dedupePages([list]);
}

/** DEV only. One line per duplicate, naming both pages and both positions. */
export function warnDuplicates(where: string, drops: DedupeDrop[]): void {
  if (drops.length === 0) return;
  if (!import.meta.env.DEV) return;
  for (const d of drops) {
    console.warn(`[${where}] duplicate stream id dropped`, d);
  }
}
