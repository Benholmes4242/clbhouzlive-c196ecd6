/**
 * GUEST BROWSING — Stage 2 is preview-only. Production stays OFF.
 * Stage 3 turns guest browsing on everywhere after preview verification.
 *
 * Everything guest reads this constant; tests mock this module.
 * The switch is also off under test (jsdom is a preview host, so without the
 * MODE guard every unrelated test would run with guest browsing on).
 */
import { isPreviewHost } from '@/utils/native/isNativeApp';

/** Pure rule, kept separate so tests can assert the composition directly. */
export const guestEnabledForHost = (previewHost: boolean, mode: string) =>
  previewHost && mode !== 'test';

export const GUEST_BROWSING_ENABLED = guestEnabledForHost(isPreviewHost(), import.meta.env.MODE);
