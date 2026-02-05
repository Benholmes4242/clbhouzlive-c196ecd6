 /**
  * Hub Theme - Centralised color definitions for Hub page
  * Matches Echo's echoTheme.ts pattern for dark mode readiness
  */
 
export const HUB_COLORS = {
  // Page
  pageBg: '#F0F2F5',
  
  // Text
  textPrimary: '#1D1D1F',
  textSecondary: '#8E8E93',
  textMeta: '#6B7280',
  
  // Messages card - stronger green tint for visibility
  messagesBg: '#E8F5E9',
  messagesIcon: '#25D366',
  messagesBadge: '#25D366',
  messagesNewChatBg: '#25D366',
  messagesNewChatText: '#FFFFFF',
  messagesNewGroupBg: 'rgba(255,255,255,0.8)',
  messagesRowActive: '#D4EED8',
   
   // Borders & dividers - softer green for messages card
   divider: '#C8E6C9',
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
 } as const;