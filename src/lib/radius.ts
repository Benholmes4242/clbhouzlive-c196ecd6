/**
 * App-wide radius canon.
 *
 * `md` and `lg` remain the gated values until the computed 10/12/14/16/18
 * geometry count is accepted. All new aliases read from this single object.
 */
export const r = {
  none: '0px',
  bar: '2px',
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  sheet: '20px',
  pill: '999px',
  avatar: '34%',
} as const;

export type RadiusToken = keyof typeof r;