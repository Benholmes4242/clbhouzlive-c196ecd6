/** Shared icon color theme for settings rows */
export type IconTheme = 'account' | 'creator' | 'privacy' | 'notifications' | 'security' | 'support' | 'legal' | 'danger' | 'default';

// TODO: Add dark mode variants for icon container colors in a future pass.
// These hardcoded light-mode colors (bg-blue-50, etc.) intentionally mimic
// iOS Settings per-category coloring but won't adapt to dark mode.
export const iconThemeStyles: Record<IconTheme, { bg: string; text: string }> = {
  account: { bg: 'bg-indigo-50', text: 'text-indigo-500' },
  creator: { bg: 'bg-purple-50', text: 'text-purple-500' },
  privacy: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  notifications: { bg: 'bg-amber-50', text: 'text-amber-500' },
  security: { bg: 'bg-red-50', text: 'text-red-400' },
  support: { bg: 'bg-sky-50', text: 'text-sky-500' },
  legal: { bg: 'bg-slate-100', text: 'text-slate-400' },
  danger: { bg: 'bg-red-50', text: 'text-red-500' },
  default: { bg: 'bg-slate-100', text: 'text-slate-500' },
};
