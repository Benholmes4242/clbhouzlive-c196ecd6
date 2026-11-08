import { OVERVIEW_KICKER_ROW_HEIGHT, OVERVIEW_KICKER_LINE_HEIGHT, OVERVIEW_LIVE_STACK } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandGeometry';
/** Live overview alone is 350px, notch inside. Other photographic heroes
 * flow from its derived kicker TEXT top and end below their own content.
 * Never add safe-area to the reference. Images/crops/fades stay unchanged. */
export const HERO_PHOTO_HEIGHT = 350;
export const HERO_CONTENT_BOTTOM = 14;
export const HERO_CONTENT_TOP = HERO_PHOTO_HEIGHT - HERO_CONTENT_BOTTOM - OVERVIEW_LIVE_STACK + (OVERVIEW_KICKER_ROW_HEIGHT - OVERVIEW_KICKER_LINE_HEIGHT) / 2;

/** Legacy fixed-height compatibility for consumers outside the flow conversion. */
export const EXPLORE_COURSE_HERO_HEIGHT = HERO_PHOTO_HEIGHT;
