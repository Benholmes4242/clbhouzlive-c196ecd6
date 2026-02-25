// Haptic feedback utility
export const triggerHaptic = (type: 'light' | 'success' | 'warning' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      success: [10, 50, 10],
      warning: [20, 30, 20],
    };
    navigator.vibrate(patterns[type]);
  }
};

// Quick reaction emojis for empty state
export const QUICK_REACTIONS = ['🔥', '⛳', '👏', '😂', '❤️'] as const;

// Report reasons
export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'nudity', label: 'Nudity' },
  { id: 'violence', label: 'Violence' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'other', label: 'Other' },
];
