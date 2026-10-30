/**
 * GUEST BROWSING — THE SWITCH (Stage 1 of 2).
 *
 * Default OFF. With it false the app behaves byte-for-byte as before: a
 * signed-out phone is redirected to /auth and nothing in src/features/guest
 * runs. Stage 2 (server SQL for anonymous sessions, Supabase Auth anonymous
 * sign-ins + manual linking enabled by Ben) turns this on.
 *
 * Everything guest reads this constant; tests mock this module.
 */
export const GUEST_BROWSING_ENABLED = false;
