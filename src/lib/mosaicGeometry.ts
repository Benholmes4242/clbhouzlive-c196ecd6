/**
 * ONE MOSAIC GEOMETRY (BRIEF_MEDIA_TAB_AND_THE_COUNT §4).
 *
 * The same photographs are reachable from /media and from a course's Media
 * tab, and they were laid out two different ways depending on the door a
 * member came through. Both walls now read these two values: a 2px gutter and
 * the r.xs tile radius, full bleed to the viewport edges.
 */
import { r } from '@/lib/radius';

export const MOSAIC_GAP = 2;
export const MOSAIC_RADIUS = parseInt(r.xs, 10) || 6;
