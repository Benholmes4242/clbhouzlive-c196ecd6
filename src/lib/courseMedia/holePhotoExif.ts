/** MEDIA_ENGINE_1: import the approved lite build explicitly, never the full default.
 * Capture day is the EXIF wall-calendar day, not a UTC conversion. GPS absence
 * is ordinary metadata absence; only the capture day drives the verdict.
 */
import { parse } from 'exifr/dist/lite.esm.js';

export interface HolePhotoExif {
  capturedAt: string | null;
  captureDay: string | null;
  latitude: number | null;
  longitude: number | null;
}

const two = (value: number) => String(value).padStart(2, '0');
const coordinate = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function readHolePhotoExif(file: File): Promise<HolePhotoExif> {
  const metadata = await parse(file, { exif: true, gps: true }) as Record<string, unknown> | undefined;
  const date = metadata?.DateTimeOriginal;
  const validDate = date instanceof Date && Number.isFinite(date.getTime());
  const captureDay = validDate
    ? `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
    : null;
  return {
    captureDay,
    capturedAt: validDate && captureDay
      ? `${captureDay}T${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
      : null,
    latitude: coordinate(metadata?.latitude),
    longitude: coordinate(metadata?.longitude),
  };
}