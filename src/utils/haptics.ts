/**
 * Legacy shim → routes through the bridge-aware util in src/lib/ui/haptics.
 * Preserves the `haptic('light'|'medium'|'heavy')` signature used by
 * UnifiedAchievementSheet, MediaCarousel, comments-v2, etc. so those
 * call sites light up on iOS via the Median bridge without any changes.
 */
import { triggerHaptic } from '@/lib/ui/haptics';

export function haptic(kind: 'light' | 'medium' | 'heavy' = 'light'): void {
  triggerHaptic(kind);
}

export { triggerHaptic };
