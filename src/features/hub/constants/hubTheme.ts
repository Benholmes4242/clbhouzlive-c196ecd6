/**
 * Hub Theme - Centralised color definitions for Hub page
 * All colors applied via inline styles (not dynamic Tailwind classes)
 * to ensure JIT compatibility.
 */

export const HUB_COLORS = {
  // Page
  pageBg: '#F8FAFC',
  pageBgEnd: '#F1F5F9',
  
  // Text
  textPrimary: '#1D1D1F',
  textSecondary: '#8E8E93',
  textMeta: '#6B7280',
  
  // Messages card
  messagesBg: '#FFFFFF',
  messagesIcon: '#25D366',
  messagesBadge: '#25D366',
  messagesNewChatBg: 'rgba(42, 157, 92, 0.15)',
  messagesNewChatText: '#1D1D1F',
  messagesNewGroupBg: 'rgba(0,0,0,0.05)',
  messagesRowActive: '#F5F5F5',
   
  // Borders & dividers
  divider: '#E5E5EA',
  chevron: '#C7C7CC',
  
  // Status
  onlineGreen: '#34C759',
  unreadGreen: '#2A9D5C',
  notificationOrange: '#F97316',
  
  // Skeleton
  skeletonFrom: '#E5E7EB',
  skeletonVia: '#F3F4F6',
  skeletonTo: '#E5E7EB',
  
  // Groups
  groupAvatarFrom: '#E8F5E1',
  groupAvatarTo: '#DCF0D4',
  groupAvatarIcon: '#2A9D5C',
  
  // Empty state
  emptyBg: '#F0F0F5',
  emptyIcon: '#8E8E93',
  
  // Offline banner
  offlineBg: '#FEF3C7',
  offlineText: '#92400E',

  // Echo card
  echoBg: '#FFF4E6',
  echoBgGradient: 'linear-gradient(135deg, #FFF8F0 0%, #FFF4E6 50%, #FFEDD5 100%)',
  echoOrb: '#FFBF66',
  echoActive: '#FFECDA',
  echoInputBorder: 'rgba(255, 191, 102, 0.2)',

  // Shadows
  cardShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  cardShadowHover: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
} as const;
