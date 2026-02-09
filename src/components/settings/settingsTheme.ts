/** Shared icon color theme for settings rows */
export type IconTheme = 'account' | 'creator' | 'privacy' | 'notifications' | 'security' | 'support' | 'legal' | 'danger' | 'default';

export const iconThemeStyles: Record<IconTheme, { bg: string; text: string }> = {
  account: { bg: 'bg-blue-50', text: 'text-blue-500' },
  creator: { bg: 'bg-purple-50', text: 'text-purple-500' },
  privacy: { bg: 'bg-green-50', text: 'text-green-500' },
  notifications: { bg: 'bg-amber-50', text: 'text-amber-500' },
  security: { bg: 'bg-red-50', text: 'text-red-500' },
  support: { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  legal: { bg: 'bg-gray-100', text: 'text-gray-500' },
  danger: { bg: 'bg-red-100', text: 'text-red-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-600' },
};
