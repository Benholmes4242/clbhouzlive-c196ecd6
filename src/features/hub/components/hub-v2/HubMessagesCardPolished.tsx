/**
 * HubMessagesCardPolished - Semantic token migration
 * All hardcoded HUB_COLORS replaced with semantic tokens
 * Intentional brand colors (#25D366, #22C55E, #2A9D5C) preserved
 */

import { useMemo, useEffect } from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePresence, type PresenceStatus } from '@/hooks/usePresence';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ============ Brand Constants (intentional) ============
const BRAND = {
  messagesIcon: '#25D366',
  unreadGreen: '#2A9D5C',
  onlineGreen: '#22C55E',
  newChatBg: 'rgba(42, 157, 92, 0.15)',
} as const;

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
    <div 
      className="w-3 h-3 rounded-full border-2 border-card" 
      style={{ backgroundColor: BRAND.onlineGreen }}
      aria-hidden="true" 
    />
  );
}

// ============ Group Avatar (Single SquircleAvatar — matches DM) ============

function GroupAvatarSingle({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <SquircleAvatar
      size={56}
      src={avatarUrl}
      alt={name}
      fallback={name.charAt(0).toUpperCase()}
      hideRing
    />
  );
}

// ============ Loading Skeleton ============

function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
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

      const lastMessagePreview = conv.last_message_preview || 'No messages yet';
      
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

  const handleNewChat = () => {
    haptic('light');
    navigate('/messages?new=dm');
  };
  
  const handleNewGroup = () => {
    haptic('light');
    navigate('/messages?new=group');
  };

  return (
    <div 
      className={cn("rounded-[18px] overflow-hidden flex flex-col bg-card shadow-sm border border-border/60", className)}
    >
      {/* Header row */}
      <button
        onClick={() => {
          haptic('light');
          navigate('/messages');
        }}
        className="flex-none flex items-center justify-between w-full px-4 pt-4 pb-3 transition-all rounded-t-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.98] active:opacity-90"
        aria-label="Open all messages"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" style={{ color: BRAND.messagesIcon }} aria-hidden="true" />
          <span className="text-[17px] font-semibold text-foreground">Messages</span>
          
          {/* Unread badge next to header — sole unread indicator (green dot removed) */}
          {unreadCount > 0 && (
            <span 
              className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ backgroundColor: BRAND.unreadGreen }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/40" aria-hidden="true" />
      </button>

      {/* Conversation previews */}
      <div 
        data-hub-scrollable
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onTouchMove={(e) => {
          const target = e.currentTarget;
          const canScroll = target.scrollHeight > target.clientHeight;
          if (!canScroll) e.stopPropagation();
        }}
        role="list"
      >
        {isLoading && !conversations?.length && (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        )}
        
        {conversationPreviews.length > 0 ? (
          conversationPreviews.map((conv, index) => {
            const presenceStatus = conv.otherUserId 
              ? presenceMap.get(conv.otherUserId)?.status 
              : undefined;
            const showDivider = index < conversationPreviews.length - 1;
            
            return (
              <div key={conv.id} className="relative">
                <button
                  role="listitem"
                  onClick={() => {
                    haptic('light');
                    navigate(`/messages/${conv.id}`);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.98] active:opacity-90"
                  aria-label={`Open conversation with ${conv.name}${conv.unreadCount > 0 ? ', unread' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0" aria-hidden="true">
                    {conv.isGroup ? (
                      <GroupAvatarSingle name={conv.name} avatarUrl={conv.avatarUrl} />
                    ) : (
                      <>
                        <SquircleAvatar
                          size={56}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span 
                        className={cn("text-[16px] truncate text-foreground", conv.unreadCount > 0 ? "font-bold" : "font-semibold")}
                      >
                        {conv.name}
                      </span>
                      <span 
                        className={cn("text-[12px] flex-shrink-0", conv.unreadCount > 0 ? "font-medium" : "text-muted-foreground")}
                        style={conv.unreadCount > 0 ? { color: BRAND.unreadGreen } : undefined}
                      >
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p 
                        className={cn(
                          "text-[14px] truncate flex-1",
                          conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span 
                          className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: BRAND.unreadGreen }}
                        >
                          <span className="text-[12px] font-bold text-white">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                
                {/* Divider - inset after avatar */}
                {showDivider && (
                  <div className="h-px ml-[82px] bg-border" />
                )}
              </div>
            );
          })
        ) : !isLoading && (
          <button
            role="listitem"
            onClick={() => {
              haptic('light');
              navigate('/messages');
            }}
            className="w-full px-4 py-3 flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.98] active:opacity-90"
            aria-label="Start your first conversation"
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center bg-muted"
              aria-hidden="true"
            >
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-[14px] text-muted-foreground">
              No conversations yet
            </span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex-none h-px ml-[82px] mr-4 bg-border" aria-hidden="true" />

      {/* Action buttons */}
      <div className="flex-none flex gap-2 p-4">
        <button
          onClick={handleNewChat}
          className="flex-1 h-11 rounded-full text-[15px] font-semibold transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-foreground"
          style={{ backgroundColor: BRAND.newChatBg }}
          aria-label="Start a new chat"
        >
          New Chat
        </button>
        <button
          onClick={handleNewGroup}
          className="flex-1 h-11 rounded-full bg-muted text-[15px] font-semibold text-foreground transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Create a new group"
        >
          New Group
        </button>
      </div>
    </div>
  );
}
