/** VIDEO_POSTERS_1: pure frame selection; no runtime/network dependencies. */
export const STREAM_HOST = 'https://customer-4ah4gni80ytefpck.cloudflarestream.com';
export function candidateTimes(duration: number | null): number[] {
  const known = duration != null && Number.isFinite(duration) && duration > 0;
  const times = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 60];
  if (known) times.push(Math.floor(duration * 0.25), Math.floor(duration * 0.5));
  return [...new Set(times)].filter(t => !known || t < duration - 1);
}
export interface FrameStats { mean: number; sd: number }
export interface FrameChoice extends FrameStats { time: number; passed: boolean }
export function lumaStats(rgba: ArrayLike<number>): FrameStats {
  const count = Math.floor(rgba.length / 4);
  if (!count) throw new Error('Empty frame');
  let sum = 0, squares = 0;
  for (let i = 0; i < count * 4; i += 4) {
    const luma = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    sum += luma;
    squares += luma * luma;
  }
  const mean = sum / count;
  return { mean, sd: Math.sqrt(Math.max(0, squares / count - mean * mean)) };
}
export function picturePasses({ mean, sd }: FrameStats): boolean { return mean >= 35 && sd >= 15; }
export function chooseFrame(frames: FrameChoice[]): FrameChoice | null {
  const passing = frames.find(frame => frame.passed);
  return passing ?? frames.reduce<FrameChoice | null>((best, frame) =>
    !best || frame.mean + frame.sd > best.mean + best.sd ? frame : best, null);
}
export function posterUrl(streamId: string, time: number): string {
  return `${STREAM_HOST}/${streamId}/thumbnails/thumbnail.jpg?height=1080&fit=crop&time=${time}s`;
}