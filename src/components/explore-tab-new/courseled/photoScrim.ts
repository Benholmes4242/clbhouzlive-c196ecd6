/**
 * MOVED — the canonical scrim now lives at src/styles/photoScrim.ts
 * (BRIEF_APP_WIDE_SCRIM §4.1), because ~30 feature files should not import a
 * platform token out of a Discover sub-folder. This re-export exists so the
 * move lands in one step; new code imports from '@/styles/photoScrim'.
 */
export { SCRIM_STANDOUT, CHIP_GLASS, CHIP_GLASS_BG, CHIP_GLASS_BORDER } from '@/styles/photoScrim';
