 /**
  * Hub Theme - Centralised color definitions for Hub page
  * Matches Echo's echoTheme.ts pattern for dark mode readiness
  */
 
 export const HUB_COLORS = {
   // Page
   pageBg: '#F8FAFC',
   
   // Text
   textPrimary: '#1D1D1F',
   textSecondary: '#8E8E93',
   textMeta: '#6B7280',
   
   // Messages card
   messagesBg: '#FFFFFF',
   messagesIcon: '#2A9D5C',
   messagesBadge: '#2A9D5C',
   messagesNewChatBg: '#E8F5E1',
   messagesNewGroupBg: '#F0F0F5',
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
   groupAvatarFrom: '#8B5CF6',
   groupAvatarTo: '#7C3AED',
   
   // Empty state
   emptyBg: '#F0F0F5',
   emptyIcon: '#8E8E93',
   
   // Offline banner
   offlineBg: '#FEF3C7',
   offlineText: '#92400E',
 } as const;