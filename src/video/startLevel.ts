/**
 * startLevel — initial ABR rung selection.
 *
 * WHY THIS EXISTS
 * hls.js's default cold-start behaviour (`startLevel: undefined` +
 * `testBandwidth: true`) deliberately fetches the FIRST fragment at the
 * LOWEST rendition to measure throughput. Cloudflare Stream ladders here
 * start at 240x426, and our segments are 4s long — so a viewer sees ~4-8s
 * of heavily-blurred video before ABR climbs to 720p/1080p. The fullscreen
 * lane made it worse by pinning `startLevel: 0` explicitly.
 *
 * The fix is to start on a rung that MATCHES the surface (rendered pixel
 * height) and the connection we already know about (persisted bandwidth
 * memory + Network Information API), so the very first decoded frame is
 * already sharp.
 */

export interface LevelLike {
  height?: number;
  width?: number;
  bitrate?: number;
}

/** Conservative floor so a cold, unknown connection still starts sharp-ish. */
const UNKNOWN_SEED_BPS = 2_500_000;

/**
 * Best-effort bandwidth seed in bits/sec. Prefers a real measurement from
 * bandwidth memory (passed in by the caller), then the Network Information
 * API downlink, then a sane default.
 */
export function bandwidthSeed(remembered?: number | null): number {
  if (remembered && isFinite(remembered) && remembered > 0) return remembered;
  try {
    const conn = (navigator as any)?.connection;
    const downlinkMbps = conn?.downlink;
    if (typeof downlinkMbps === 'number' && downlinkMbps > 0) {
      // `downlink` is a rounded, capped (10Mbps) estimate — use 70% of it.
      return Math.max(1_000_000, Math.round(downlinkMbps * 1_000_000 * 0.7));
    }
    const et = conn?.effectiveType as string | undefined;
    if (et === 'slow-2g' || et === '2g') return 350_000;
    if (et === '3g') return 1_200_000;
  } catch { /* no navigator.connection */ }
  return UNKNOWN_SEED_BPS;
}

/** Device pixel height available for a full-bleed surface. */
export function viewportPixelHeight(): number {
  if (typeof window === 'undefined') return 1280;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const vv = window.visualViewport;
  const cssH = (vv?.height && vv.height > 0 ? vv.height : window.innerHeight) || 720;
  return Math.round(cssH * dpr);
}

/**
 * Pick the initial rung: the highest level that both
 *   (a) fits the rendered pixel height (with a little headroom), and
 *   (b) fits inside `bwBps * SAFETY`,
 * never below `minHeight` (so we don't open at 240p on a good connection),
 * and never above the ladder.
 */
export function pickStartLevel(
  levels: LevelLike[],
  renderedPixelHeight: number,
  bwBps: number,
  opts: { minHeight?: number; safety?: number } = {},
): number {
  if (!levels || levels.length === 0) return -1;
  const minHeight = opts.minHeight ?? 540;
  const safety = opts.safety ?? 0.85;
  const budget = Math.max(400_000, bwBps * safety);
  // Ladder sorted by height ascending, keeping original indices.
  const ranked = levels
    .map((l, index) => ({ index, height: l.height ?? 0, bitrate: l.bitrate ?? 0 }))
    .sort((a, b) => a.height - b.height);

  const resolutionCap = Math.round(renderedPixelHeight * 1.05);
  let chosen = -1;
  for (const lvl of ranked) {
    const fitsScreen = lvl.height <= resolutionCap || lvl.height <= minHeight;
    const fitsBudget = lvl.bitrate <= budget;
    if (fitsScreen && fitsBudget) chosen = lvl.index;
  }
  if (chosen === -1) {
    // Nothing fit the budget — take the smallest rung that still clears
    // `minHeight` if the ladder has one, else the very lowest.
    const aboveMin = ranked.find((l) => l.height >= minHeight);
    chosen = (aboveMin ?? ranked[0]).index;
  }
  return chosen;
}

/**
 * Apply the picked rung to a live hls.js instance at MANIFEST_PARSED time.
 * Safe to call repeatedly. Returns the level index applied (or -1).
 */
export function applyStartLevel(
  hls: {
    levels?: LevelLike[];
    currentLevel?: number;
    nextLevel?: number;
    startLevel?: number;
    bandwidthEstimate?: number;
    config?: Record<string, unknown>;
  },
  renderedPixelHeight: number,
  rememberedBw?: number | null,
  minHeight?: number,
): number {
  const levels = hls.levels ?? [];
  if (levels.length === 0) return -1;
  const bw = Math.max(bandwidthSeed(rememberedBw), hls.bandwidthEstimate || 0);
  const level = pickStartLevel(levels, renderedPixelHeight, bw, { minHeight });
  if (level < 0) return -1;
  try {
    // startLevel governs the first fragment; nextLevel forces the rung when
    // the first fragment request has already been queued. After the first
    // switch ABR takes over normally (we never pin currentLevel).
    hls.startLevel = level;
    if ((hls.currentLevel ?? -1) < 0 || (hls.currentLevel ?? -1) < level) {
      hls.nextLevel = level;
    }
  } catch { /* hls torn down mid-flight */ }
  return level;
}
