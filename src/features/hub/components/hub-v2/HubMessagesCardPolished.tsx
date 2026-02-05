/**
 * HubMessagesCardPolished - WhatsApp-Style Messages Card
 * White bubble, minimal chrome, content-focused
  * A* Level - All accessibility and design fixes applied
 */

import { useMemo, useEffect } from 'react';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePresence, type PresenceStatus } from '@/hooks/usePresence';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
 import { HUB_COLORS } from '../../constants/hubTheme';
 import { Skeleton } from '@/components/ui/skeleton';

// ============ Types ============

interface ParticipantPreview {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

interface ConversationPreview {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  participantCount?: number;
  participants?: ParticipantPreview[];
  otherUserId?: string;
}

interface HubMessagesCardPolishedProps {
  conversations: any[];
  userId: string | undefined;
  unreadCount: number;
   isLoading?: boolean;
  className?: string;
}

// ============ Online Status Dot ============

function OnlineDot({ status }: { status: PresenceStatus }) {
  if (status !== 'online') return null;
  
  return (
     <div className={`w-3 h-3 rounded-full border-2 border-white bg-[${HUB_COLORS.onlineGreen}]`} aria-hidden="true" />
  );
}
 
 // ============ Loading Skeleton ============
 
 function ConversationSkeleton() {
   return (
     <div className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-[34%] flex-shrink-0" style={{ aspectRatio: '1/1.05' }} />
       <div className="flex-1 space-y-2">
         <div className="flex justify-between">
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-3 w-8" />
         </div>
         <Skeleton className="h-3 w-full" />
       </div>
     </div>
   );
 }

// ============ Main Component ============

 export function HubMessagesCardPolished({ conversations, userId, unreadCount, isLoading, className }: HubMessagesCardPolishedProps) {
  const navigate = useNavigate();
  const { presenceMap, subscribeToPresence } = usePresence();
  
  const conversationPreviews: ConversationPreview[] = useMemo(() => {
    if (!conversations?.length || !userId) return [];
    
    // Show up to 2 recent conversations
    return conversations.slice(0, 2).map(conv => {
      const otherParticipants = conv.participants?.filter((p: any) => p.user_id !== userId) || [];
      const isGroup = conv.type === 'group';
      const firstOther = otherParticipants[0];
      
      const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      };
      
      const participantPreviews: ParticipantPreview[] = otherParticipants.map((p: any) => ({
        id: p.user_id || '',
        displayName: p.profile?.display_name || p.profile?.username || 'Unknown',
        avatarUrl: p.profile?.profile_photo_url || undefined,
      }));

      // Format last message with "You:" prefix if own message
      let lastMessagePreview = conv.last_message_preview || 'No messages yet';
      // For groups, show sender name prefix
      if (isGroup && conv.last_message_preview) {
        // The preview may already include sender context from the DB
        // For now, just use the preview as-is
      }
      
      return {
        id: conv.id,
        name: isGroup 
          ? conv.name || 'Group Chat' 
          : firstOther?.profile?.display_name || firstOther?.profile?.username || 'Unknown',
        avatarUrl: isGroup 
          ? conv.avatar_url || undefined 
          : firstOther?.profile?.profile_photo_url || undefined,
        lastMessage: lastMessagePreview,
        timestamp: formatTime(conv.last_message_at),
        unreadCount: conv.unread_count || 0,
        isGroup,
        participantCount: conv.participants?.length,
        participants: participantPreviews,
        otherUserId: !isGroup && firstOther ? firstOther.user_id || undefined : undefined,
      };
    });
  }, [conversations, userId]);
  
  useEffect(() => {
    const dmUserIds = conversationPreviews
      .filter(c => !c.isGroup && c.otherUserId)
      .map(c => c.otherUserId as string);
    
    if (dmUserIds.length > 0) {
      subscribeToPresence(dmUserIds);
    }
  }, [conversationPreviews, subscribeToPresence]);

  const handleOpenMessages = () => {
    haptic('light');
    navigate('/messages');
  };
  
  const handleNewChat = () => {
    haptic('light');
    navigate('/messages?new=dm');
  };
  
  const handleNewGroup = () => {
    haptic('light');
    navigate('/messages?new=group');
  };

  return (
     <div className={`bg-[${HUB_COLORS.messagesBg}] rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col ${className || ''}`}>
       {/* Header row - tappable to navigate to Messages */}
       <button
         onClick={() => {
           haptic('light');
           navigate('/messages');
         }}
         className="flex-none flex items-center justify-between w-full px-4 pt-4 pb-2 active:bg-gray-50 transition-colors rounded-t-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-inset"
         aria-label="Open all messages"
       >
         <div className="flex items-center gap-2">
           <MessageCircle className={`w-5 h-5 text-[${HUB_COLORS.messagesIcon}]`} aria-hidden="true" />
           <span className={`text-[1.0625rem] font-semibold text-[${HUB_COLORS.textPrimary}]`}>Messages</span>
          {unreadCount > 0 && (
             <span className={`min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-[${HUB_COLORS.messagesBadge}] text-white text-[0.6875rem] font-bold`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
         <ChevronRight className={`w-5 h-5 text-[${HUB_COLORS.chevron}]`} aria-hidden="true" />
       </button>

      {/* Conversation preview - scrollable content area */}
       <div className="flex-1 min-h-0 overflow-y-auto" role="list">
       {/* Loading skeleton */}
       {isLoading && !conversations?.length && (
         <>
           <ConversationSkeleton />
           <ConversationSkeleton />
         </>
       )}
       
       {/* Conversation list */}
      {conversationPreviews.length > 0 ? (
        conversationPreviews.map((conv) => {
          const presenceStatus = conv.otherUserId 
            ? presenceMap.get(conv.otherUserId)?.status 
            : undefined;
          
          return (
            <button
              key={conv.id}
               role="listitem"
              onClick={() => {
                haptic('light');
                navigate(`/messages/${conv.id}`);
              }}
               className={`w-full px-4 py-3 flex items-center gap-3 active:bg-[${HUB_COLORS.messagesRowActive}] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-inset`}
               aria-label={`Open conversation with ${conv.name}${conv.unreadCount > 0 ? ', unread' : ''}`}
            >
              {/* Avatar */}
               <div className="relative flex-shrink-0" aria-hidden="true">
                {conv.isGroup ? (
                   <div 
                     className={`w-10 flex items-center justify-center bg-gradient-to-br from-[${HUB_COLORS.groupAvatarFrom}] to-[${HUB_COLORS.groupAvatarTo}]`}
                     style={{ aspectRatio: '1/1.05', borderRadius: '34%' }}
                   >
                    <Users className={`w-4 h-4 text-[${HUB_COLORS.groupAvatarIcon}]`} />
                  </div>
                ) : (
                  <>
                    <SquircleAvatar
                      size={40}
                      src={conv.avatarUrl}
                      alt={conv.name}
                      fallback={conv.name.charAt(0).toUpperCase()}
                      hideRing
                    />
                    {presenceStatus && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineDot status={presenceStatus} />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn(
                     "text-[0.9375rem] truncate",
                     conv.unreadCount > 0 ? `font-bold text-[${HUB_COLORS.textPrimary}]` : `font-semibold text-[${HUB_COLORS.textPrimary}]`
                  )}>
                    {conv.name}
                  </span>
                  <span className={cn(
                     "text-[0.75rem] flex-shrink-0",
                     conv.unreadCount > 0 ? `text-[${HUB_COLORS.unreadGreen}] font-medium` : `text-[${HUB_COLORS.textSecondary}]`
                  )}>
                    {conv.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn(
                     "text-[0.8125rem] truncate flex-1",
                     conv.unreadCount > 0 ? `text-[${HUB_COLORS.textPrimary}] font-medium` : `text-[${HUB_COLORS.textSecondary}]`
                  )}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                     <span className={`ml-2 min-w-[20px] h-5 px-1.5 bg-[${HUB_COLORS.messagesBadge}] rounded-full flex items-center justify-center`} aria-hidden="true">
                       <span className="text-[0.75rem] font-bold text-white">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })
       ) : !isLoading && (
        <button
           role="listitem"
          onClick={handleOpenMessages}
           className={`w-full px-4 py-3 flex items-center gap-3 active:bg-[${HUB_COLORS.messagesRowActive}] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-inset`}
           aria-label="Start your first conversation"
        >
           <div 
             className={`w-10 bg-[${HUB_COLORS.emptyBg}] flex items-center justify-center`} 
             style={{ aspectRatio: '1/1.05', borderRadius: '34%' }}
             aria-hidden="true"
           >
             <MessageCircle className={`w-4 h-4 text-[${HUB_COLORS.emptyIcon}]`} />
          </div>
           <span className={`text-[0.875rem] text-[${HUB_COLORS.textSecondary}]`}>
            No conversations yet
          </span>
        </button>
      )}
      </div>

      {/* Divider */}
       <div className={`flex-none h-px bg-[${HUB_COLORS.divider}] mx-4`} aria-hidden="true" />

      {/* Action buttons - fixed at bottom */}
      <div className="flex-none flex gap-2 p-4">
         <button
           onClick={handleNewChat}
            className={`flex-1 h-11 bg-[${HUB_COLORS.messagesNewChatBg}] text-white rounded-full text-[0.9375rem] font-semibold active:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-offset-2`}
            aria-label="Start a new chat"
         >
           New Chat
         </button>
         <button
           onClick={handleNewGroup}
            className={`flex-1 h-11 bg-[${HUB_COLORS.messagesNewGroupBg}] text-[${HUB_COLORS.textPrimary}] rounded-full text-[0.9375rem] font-semibold active:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-offset-2`}
            aria-label="Create a new group"
         >
           New Group
         </button>
      </div>
    </div>
  );
}
