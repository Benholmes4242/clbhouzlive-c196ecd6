/**
 * BRIEF_CONTENT_DESK Stage 4 — display helpers for the Tour data section.
 * Pure, so the rules the brief states are unit-tested.
 */

/** Shared exact-name matching for Rankings and the loaded player directory. */
export function matchKey(name: string | null | undefined): string {
  return (name ?? '').replace(/\u2019/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Any all-caps word of 2+ letters becomes title case; mixed case stays. */
export function normaliseRankingName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\p{L}[\p{L}'’-]*/gu, (word) => {
    const letters = word.replace(/[^\p{L}]/gu, '');
    if (letters.length < 2 || letters !== letters.toUpperCase() || letters === letters.toLowerCase()) return word;
    return word
      .toLowerCase()
      .replace(/(^|['’-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
  });
}

const RANKING_TOUR: Record<string, string> = { euro: 'DP World', lpga: 'LPGA', pgad: 'Americas', liv: 'LIV' };
export function rankingTourLabel(code: string): string {
  return RANKING_TOUR[code] ?? code.toUpperCase();
}

/** One decimal, thousands separators: 3713.9 → "3,713.9". */
export function formatPoints(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(Number(p))) return '-';
  return Number(p).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** by_tour may arrive as {code: n} or [{tour_code|code, n|count|rows}]. */
export function byTourEntries(raw: unknown): { code: string; n: number }[] {
  if (Array.isArray(raw)) {
    return raw
      .map((r: any) => ({ code: String(r?.tour_code ?? r?.code ?? r?.tour ?? ''), n: Number(r?.n ?? r?.count ?? r?.rows ?? 0) }))
      .filter((r) => r.code);
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([code, n]) => ({ code, n: Number(n) || 0 }));
  }
  return [];
}

export const minutesSince = (iso: string | null | undefined, now = Date.now()) =>
  iso ? (now - new Date(iso).getTime()) / 60_000 : Infinity;

/**
 * Feeds header copy. A single feed reads "1 needs a run"; two or more read
 * "3 need a run". Failures outrun the count, and nothing pending reads
 * "All running".
 */
export function feedsHeadline(failures: number, needs: number): { text: string; tone: 'danger' | 'warn' | 'ok' } {
  if (failures > 0) return { text: `${failures} failed in 24 h`, tone: 'danger' };
  if (needs > 0) return { text: `${needs} ${needs === 1 ? 'needs' : 'need'} a run`, tone: 'warn' };
  return { text: 'All running', tone: 'ok' };
}
