/**
 * DARK business palette (BRIEF_BUSINESS_TOKENS_ONTO_THE_DARK_RAMP).
 *
 * Every value is DERIVED from the analytical `A` ramp, in the same manner as
 * src/components/manage/ui.tsx. There is no business palette: there is one app
 * ramp, named here for the fourteen files that colour the business surface.
 *
 * OVERTURNED: this file previously declared itself "light-surface" and
 * instructed readers not to import dark tokens. clbhouz is dark-only, and the
 * reference it cited for its own light values (edit-v2 SectionCard) renders
 * A.PANEL with an A.BORDER hairline. Adding a colour literal here is a defect;
 * put it in `A` or don't use it.
 *
 * TWO DELIBERATE RE-SCALINGS, not conversions:
 *   inkMute -> A.BODY (0.72) and inkFaint -> A.MUTE (0.62), NOT A.MUTE/A.DIM.
 *   inkFaint is the section-eyebrow slate, i.e. a slot label, and slot labels
 *   never go below 0.62. Two distinct tiers, both at or above the floor.
 *
 *   amberTint 0.10 -> 0.16 and amberHair 0.20 -> 0.28: a 10% amber wash over
 *   #1B1E27 has almost no presence, where over #ffffff it read clearly.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';

export const BIZ = {
  // Surfaces
  card:        A.PANEL,
  pageBg:      A.CANVAS,
  fill:        'rgba(255,255,255,0.06)',   // subtle raised inset (stats strip)
  fillStrong:  'rgba(255,255,255,0.10)',   // logo placeholder bg
  // Hairlines
  hair:        A.BORDER,
  hairSoft:    'rgba(255,255,255,0.07)',
  hairDashed:  'rgba(255,255,255,0.16)',   // dashed "add another" border
  // Ink
  ink:         A.INK,
  inkMute:     A.BODY,
  inkFaint:    A.MUTE,     // canonical section-eyebrow tier (floor 0.62)
  // Brand
  amber:       A.AMBER,
  amberTint:   'rgba(247,147,30,0.16)',
  amberHair:   'rgba(247,147,30,0.28)',
  amberSoft:   'rgba(247,147,30,0.70)',
  // Radii
  rCard:       16,   // rounded-2xl
  rInner:      12,   // rounded-xl (logo, stats strip, buttons)
  // Motion
  ease:        'easeOut',
} as const;
