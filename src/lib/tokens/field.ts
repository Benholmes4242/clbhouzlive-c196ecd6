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

/**
 * The whole field paint as one class, focus step included.
 *
 * Uses :focus-within, which matches the element itself as well as its
 * descendants — so it works on a wrapper <div> that holds a glyph plus a
 * transparent input AND on a self-painting <input>. No local focus state, and
 * therefore no way to break an existing onFocus side effect (CollegeHubPage's
 * blur nearly closed its results list before a tap landed).
 *
 * SAFE ON EITHER A BARE CONTROL OR A WRAPPER. The name does not say which, and
 * both are in use, so both focus: and focus-within: are carried: focus: alone
 * misses the wrapper case, focus-within: alone is the less obvious of the two.
 *
 * THE OUTLINE SUPPRESSION IS NOT A MISSING FOCUS INDICATOR, IT IS A DUPLICATE
 * ONE. This class supplies its own focus indicator — background 6% -> 10% AND
 * border 10% -> 28%, a non-colour-only change — so the user-agent outline draws
 * a SECOND, brighter ring on top of the field's own border. That is what Ben
 * saw on the autofocused country search. Remove these two utilities and the
 * ring comes back. Do not remove them from a consumer that overrides the paint.
 *
 * Do NOT also set background/border/borderRadius inline — inline style beats
 * the class and the focus step dies silently.
 */
export const FIELD_PAINT_CLASS =
  'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)] rounded-[14px] ' +
  'transition-[background-color,border-color] duration-[140ms] ease-out ' +
  'focus:outline-none focus-within:outline-none ' +
  'focus-within:bg-[rgba(255,255,255,0.10)] focus-within:border-[rgba(255,255,255,0.28)]';


/* ── THE RAISED SET — for fields on a ground LIGHTER than the canvas ──────
 *
 * THE TEST, in one line: IS THE GROUND LIGHTER THAN #15171F? Lighter -> RAISED.
 * Equal -> the canvas set above.
 *
 * Measured: 6% white over SURFACE #1B1E27 lands ~3 luminance steps from its
 * ground versus ~9 on the canvas — the well stops being a well. The value was
 * carried across and the RELATIONSHIP was not.
 *
 * THE ONE CONSTRAINT: a field's paint now depends on its parent, which nothing
 * else in this token system does. So the choice is ALWAYS an explicit import
 * the consuming file makes — never computed from context, never inherited,
 * never a prop with a default. If it can be got wrong silently, the next copy
 * will get it wrong silently.
 */
export const FIELD_RAISED_REST_BG = 'rgba(255,255,255,0.09)';
export const FIELD_RAISED_REST_BORDER = 'rgba(255,255,255,0.14)';
export const FIELD_RAISED_FOCUS_BG = 'rgba(255,255,255,0.14)';
export const FIELD_RAISED_FOCUS_BORDER = 'rgba(255,255,255,0.32)';

/** fieldPaint() for a raised ground. Same construction, raised alphas. */
export function fieldPaintRaised(focused: boolean) {
  return {
    background: focused ? FIELD_RAISED_FOCUS_BG : FIELD_RAISED_REST_BG,
    border: `1px solid ${focused ? FIELD_RAISED_FOCUS_BORDER : FIELD_RAISED_REST_BORDER}`,
    borderRadius: FIELD_RADIUS,
    transition: FIELD_TRANSITION,
  } as const;
}

/**
 * FIELD_PAINT_CLASS for a raised ground. Import this one deliberately.
 *
 * SAFE ON EITHER A BARE CONTROL OR A WRAPPER, and carries both focus: and
 * focus-within: for that reason — LocationSection's country search puts this
 * class straight on an <input>, other consumers put it on a wrapper <div>.
 *
 * THE OUTLINE SUPPRESSION IS NOT A MISSING FOCUS INDICATOR, IT IS A DUPLICATE
 * ONE: background 9% -> 14% AND border 14% -> 32% is already a visible,
 * non-colour-only focus state, so the user-agent outline is a second, brighter
 * ring drawn over the field's own border. Remove it and the ring comes back.
 */
export const FIELD_PAINT_RAISED_CLASS =
  'bg-[rgba(255,255,255,0.09)] border border-[rgba(255,255,255,0.14)] rounded-[14px] ' +
  'transition-[background-color,border-color] duration-[140ms] ease-out ' +
  'focus:outline-none focus-within:outline-none ' +
  'focus-within:bg-[rgba(255,255,255,0.14)] focus-within:border-[rgba(255,255,255,0.32)]';
