/** Profile-only time geometry: dated index points own interpolation; form attribution stays in sheetState. */
export interface HeroIndexPoint { value: number; observed_at: string }
export function indexLine(points: HeroIndexPoint[], today = Date.now()) {
  const valid = points.filter(p => Number.isFinite(p.value) && Number.isFinite(Date.parse(p.observed_at))).slice().sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
  if (valid.length < 2) return null;
  const start = Date.parse(valid[0].observed_at);
  const end = Math.max(today, Date.parse(valid[valid.length - 1].observed_at));
  const min = Math.min(...valid.map(p => p.value));
  const max = Math.max(...valid.map(p => p.value));
  const xOf = (date: number) => end === start ? 0 : (date - start) / (end - start) * 361;
  const yOf = (value: number) => max === min ? 8 : 8 + (max - value) / (max - min) * 42;
  const coords = valid.map(p => ({ x: xOf(Date.parse(p.observed_at)), y: yOf(p.value) }));
  const last = coords[coords.length - 1];
  if (last.x < 361) coords.push({ x: 361, y: last.y });
  const at = (date: string) => {
    const ms = Date.parse(date);
    if (!Number.isFinite(ms) || ms < start || ms > end) return null;
    const x = xOf(ms);
    const right = coords.findIndex(p => p.x >= x);
    if (right <= 0) return { x, y: coords[0].y };
    const a = coords[right - 1], b = coords[right];
    return { x, y: b.x === a.x ? b.y : a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x) };
  };
  return { coords, at, min, lowY: yOf(min), lastY: last.y };
}