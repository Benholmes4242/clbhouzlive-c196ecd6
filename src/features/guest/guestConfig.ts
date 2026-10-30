/**
 * GUEST BROWSING — Stage 2 is preview-only. Production stays OFF.
 * Stage 3 turns guest browsing on everywhere after preview verification.
 *
 * Everything guest reads this constant; tests mock this module.
 */
import { isPreviewHost } from '@/utils/native/isNativeApp';

export const GUEST_BROWSING_ENABLED = isPreviewHost();
