/**
 * PROFILE IMAGE-CROP ASPECTS — the one home for the crop shape of every
 * profile image surface: the personal and business covers, and the member
 * avatar. The editor's
 * crop frame and the rendered block read the SAME constant, so a crop is
 * exactly what the member gets. That only holds while the block has NO PIXEL
 * FLOOR: a floor that wins on some device changes the aspect there and makes
 * every crop frame a lie. Do not re-add one; if content stops fitting, report.
 *
 * Clearance arithmetic (content must clear safe-area + 62 island row + stack):
 *  - Personal band at 1.7 (17:10) needs safe-area + 62 + 104. The aspect wins
 *    everywhere: +2.2px on a 320pt phone, +6.2 on a 393 with a 59pt safe
 *    area, +27.9 on a Pro Max.
 *  - Business square (HeroShell, no sparkline) needs safe-area + 62 + 227.
 *    A square gives the viewport width: +11px at 320pt, +45 at 393 (59pt
 *    safe area), +82 on a Pro Max.
 */
export const PERSONAL_COVER_ASPECT = 1.7;
export const PERSONAL_COVER_ASPECT_CSS = '1.7 / 1';
export const BUSINESS_COVER_ASPECT = 1;
export const BUSINESS_COVER_ASPECT_CSS = '1 / 1';

/** The member avatar is rendered square by SquircleAvatar at every size, so
 *  its crop is square. Deliberately SEPARATE from BUSINESS_COVER_ASPECT even
 *  though both are 1 today: they are different facts that share a value, and
 *  tying them together is how the next silent breakage happens. */
export const AVATAR_CROP_ASPECT = 1;
