// haptics.ts - Bridge-aware haptic feedback helper
// Uses native bridge when available (Median), falls back to navigator.vibrate

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error';

interface MedianBridge {
  haptics?: {
    impact: (style: string) => void;
    notification: (type: string) => void;
    selection: () => void;
  };
}

export const triggerHaptic = (type: HapticType = 'light'): void => {
  // Try native bridge first (Median) - check if it exists on window
  const median = (window as unknown as { median?: MedianBridge }).median;
  if (median?.haptics) {
    try {
      switch (type) {
        case 'selection':
          median.haptics.selection();
          break;
        case 'success':
          median.haptics.notification('success');
          break;
        case 'error':
          median.haptics.notification('error');
          break;
        case 'heavy':
          median.haptics.impact('heavy');
          break;
        case 'medium':
          median.haptics.impact('medium');
          break;
        case 'light':
        default:
          median.haptics.impact('light');
          break;
      }
      return;
    } catch {
      // Fall through to vibrate
    }
  }

  // Fallback to navigator.vibrate (works on Android, no-op on iOS Safari)
  if ('vibrate' in navigator) {
    const patterns: Record<HapticType, number | number[]> = {
      light: 6,
      medium: 12,
      heavy: 20,
      selection: 10,
      success: [10, 50, 10],
      error: [20, 100, 20],
    };
    try {
      navigator.vibrate(patterns[type] || 10);
    } catch {
      // Silently fail
    }
  }
};

// Legacy exports for backwards compatibility
export const hapticTap = () => triggerHaptic('selection');
export const hapticSoft = () => triggerHaptic('light');
