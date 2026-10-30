/**
 * GUEST BROWSING — Stage 3, on in production and everywhere outside tests.
 * This module-load switch never decides native versus web. Guest creation
 * uses settled envStatus after the existing native bridge wait: native or
 * preview only; production web retains AppDownloadGate without guest sign-in.
 *
 * Everything guest reads this constant; tests mock this module.
 * The switch is also off under test (jsdom is a preview host, so without the
 * MODE guard every unrelated test would run with guest browsing on).
 */
/** Pure rule, kept separate so tests can assert the composition directly. */
export const guestEnabledForHost = (_previewHost: boolean, mode: string) =>
  mode !== 'test';

export const GUEST_BROWSING_ENABLED = import.meta.env.MODE !== 'test';
