/**
 * THE FIELD CANON — one vocabulary for every bespoke text field.
 *
 * Nine fields were found one screenshot at a time, and the ninth was a
 * character-for-character copy of one fixed two commits earlier. They all
 * shared the same template (wrapper carries the paint, transparent input, no
 * onFocus anywhere). This module exists so the next copy inherits the fix
 * instead of orphaning it.
 *
 * Rest    6% fill / 1px 10% border
 * Focus  10% fill / 1px 28% border
 * Text   96% white, placeholder 38% white
 * Radius 14. Height 44 when the field stands alone; a shorter height is only
 *        allowed when a neighbour constrains it (sheet header, control row,
 *        sticky glass bar) and the exception is written into that file.
 *
 * DARK-ONLY. Do not add a light branch.
 *
 * Not in scope: components/ui/input.tsx, components/ui/textarea.tsx and
 * search-v2/components/SearchField.tsx — already canonical; their consumers
 * inherit the focus step for free.
 */

export const FIELD_REST_BG = 'rgba(255,255,255,0.06)';
export const FIELD_REST_BORDER = 'rgba(255,255,255,0.10)';
export const FIELD_FOCUS_BG = 'rgba(255,255,255,0.10)';
export const FIELD_FOCUS_BORDER = 'rgba(255,255,255,0.28)';
export const FIELD_INK = 'rgba(255,255,255,0.96)';
export const FIELD_PLACEHOLDER = 'rgba(255,255,255,0.38)';
export const FIELD_RADIUS = 14;
export const FIELD_HEIGHT = 44;
export const FIELD_TRANSITION = 'background 140ms ease, border-color 140ms ease';

/** Tailwind placeholder utility matching FIELD_PLACEHOLDER. */
export const FIELD_PLACEHOLDER_CLASS = 'placeholder:text-[rgba(255,255,255,0.38)]';

/**
 * The paint for a field wrapper (or a self-painting input) at a given focus
 * state. Spread it; never re-declare the alphas locally.
 */
export function fieldPaint(focused: boolean) {
  return {
    background: focused ? FIELD_FOCUS_BG : FIELD_REST_BG,
    border: `1px solid ${focused ? FIELD_FOCUS_BORDER : FIELD_REST_BORDER}`,
    borderRadius: FIELD_RADIUS,
    transition: FIELD_TRANSITION,
  } as const;
}
