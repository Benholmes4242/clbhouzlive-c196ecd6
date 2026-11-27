/** Brief 44A — the live/completed race chart sizes its plot to the end labels. Edge = 350 − 8 − widest
 * label, capped at the original 262 (short names unchanged) and floored at 190. Labels start 8px after it. */
export const RACE_VIEWBOX_W = 350, RACE_LABEL_GAP = 8, RACE_EDGE_MAX = 262, RACE_EDGE_MIN = 190;
let ctx: CanvasRenderingContext2D | null | undefined;
/** Width at 10.5px in the app's system stack; 6.4px per character where canvas is unavailable (jsdom). */
export function measureRaceLabel(text: string, bold: boolean): number {
  if (ctx === undefined) { try { ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null; } catch { ctx = null; } }
  if (!ctx) return text.length * 6.4;
  ctx.font = `${bold ? 700 : 600} 10.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`;
  const w = ctx.measureText(text).width;
  return Number.isFinite(w) && w > 0 ? w : text.length * 6.4;
}
export function raceEdge(widest: number): number {
  return Math.max(RACE_EDGE_MIN, Math.min(RACE_EDGE_MAX, RACE_VIEWBOX_W - RACE_LABEL_GAP - widest));
}
