import { useState, useEffect } from 'react';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Plus, Archive, ChevronDown, ChevronRight, Users, BellOff, Building2, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SwipeableConversationItem } from './SwipeableConversationItem';
import type { ConversationWithDetails } from '@/types/messaging';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import {
  AMBER, AMBER_TINT_06, AMBER_TINT_10, AMBER_TINT_12, AMBER_TINT_25, AMBER_TINT_28,
  INK, INK_MUTE, INK_FAINT, INK_LIGHT, INK_DEEP, INK_MID, SURFACE,
  SHELL_BG, HAIRLINE_INK_6, HAIRLINE_INK_7, HAIRLINE_INK_10, INK_TINT_04, INK_TINT_05,
  SUNDRIDGE_GREEN, SUNDRIDGE_GREEN_TINT_07, SUNDRIDGE_GREEN_BORDER_18,
} from './_shared/tokens';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
  searchQuery?: string;
  onNewConversation?: () => void;
  filterType?: 'all' | 'unread' | 'groups';
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-GB', { weekday: 'short' });
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getConversationDisplay(
  conversation: ConversationWithDetails,
  active: { type: 'personal' | 'business'; id: string } | null,
): { name: string; avatarUrl: string | null; initials: string; isBusiness: boolean } {
  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(p => {
      if (!active) return true;
      const pType = (p.actor_type ?? 'personal');
      const pId = pType === 'business' ? (p.actor_id ?? null) : p.user_id;
      return !(pType === active.type && pId === active.id);
    });

    if (otherParticipant?.profile) {
      const profile = otherParticipant.profile;
      const name = profile.display_name || profile.username || 'Unknown';
      return {
        name,
        avatarUrl: profile.profile_photo_url,
        initials: name.substring(0, 2).toUpperCase(),
        isBusiness: profile.actor_type === 'business',
      };
    }

    return { name: 'Unknown User', avatarUrl: null, initials: 'U', isBusiness: false };
  }

  const name = conversation.name || 'Group Chat';
  return {
    name,
    avatarUrl: conversation.avatar_url,
    initials: name.substring(0, 2).toUpperCase(),
    isBusiness: false,
  };
}

// Typing indicator or message preview
function ConversationTypingOrPreview({ conversationId, preview, isActive }: { conversationId: string; preview: string | null; isActive: boolean }) {
  const { typingUsers } = useTypingIndicator(isActive ? conversationId : '');
  
  if (isActive && typingUsers.length > 0) {
    const text = typingUsers.length === 1 
      ? `${typingUsers[0].name} is typing...`
      : `${typingUsers.length} people typing...`;
    
    return (
      <span style={{ color: AMBER, fontStyle: 'italic' }} className="flex items-center gap-1">
        {text}
        <span className="inline-flex gap-0.5">
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: AMBER, animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: AMBER, animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: AMBER, animationDelay: '300ms' }} />
        </span>
      </span>
    );
  }
  
  return <>{preview || ''}</>;
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-[52px] w-[52px] rounded-full flex-shrink-0 bg-[#e2e8f0]" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-[#e2e8f0]" />
          <Skeleton className="h-3 w-10 bg-[#e2e8f0]" />
        </div>
        <Skeleton className="h-3 w-40 bg-[#e2e8f0]" />
      </div>
    </div>
  );
}

function EmptyState({
  onNewConversation,
  variant = 'all',
}: {
  onNewConversation?: () => void;
  variant?: 'all' | 'unread' | 'groups';
}) {
  const copy = {
    all: {
      title: 'No messages yet',
      subtitle: 'Start a conversation with your golf buddies',
      cta: 'Start a Chat',
      icon: MessageCircle,
    },
    unread: {
      title: 'All caught up',
      subtitle: "You've read everything in your inbox",
      cta: null as string | null,
      icon: Check,
    },
    groups: {
      title: 'No group chats yet',
      subtitle: 'Start a group with your friends',
      cta: 'Start a Group Chat',
      icon: Users,
    },
  }[variant];

  const Icon = copy.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative flex items-center justify-center mb-4" style={{ width: 80, height: 80 }}>
        <div className="absolute" style={{ inset: 0, borderRadius: '50%', border: `1.5px solid ${AMBER_TINT_12}` }} />
        <div className="absolute" style={{ inset: 10, borderRadius: '50%', border: '1.5px solid rgba(247,147,30,0.20)' }} />
        <div
          className="flex items-center justify-center"
          style={{ width: 40, height: 40, borderRadius: '50%', background: AMBER_TINT_10 }}
        >
          <Icon style={{ color: AMBER }} className="h-5 w-5" />
        </div>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: INK_DEEP, marginBottom: 4 }}>{copy.title}</h3>
      <p style={{ fontSize: 13, color: INK_FAINT, marginBottom: 20, maxWidth: 240 }}>
        {copy.subtitle}
      </p>
      {copy.cta && onNewConversation && (
        <button
          onClick={onNewConversation}
          className="flex items-center active:scale-[0.97] transition-transform"
          style={{
            gap: 6, padding: '8px 20px', borderRadius: 99,
            background: AMBER_TINT_10,
            border: `1px solid ${AMBER_TINT_25}`,
            color: AMBER, fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus className="h-4 w-4" />
          {copy.cta}
        </button>
      )}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="flex items-center justify-center mb-3"
        style={{ width: 48, height: 48, borderRadius: '50%', background: AMBER_TINT_10 }}
      >
        <Search style={{ color: AMBER }} className="h-5 w-5" />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: INK_DEEP, marginBottom: 4 }}>No one found</h3>
      <p style={{ fontSize: 13, color: INK_FAINT }}>
        Try a different name or username
      </p>
    </div>
  );
}

/** White card container for conversation sections */
function ConversationCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: '0 16px',
        borderRadius: 16,
        background: '#fff',
        border: `1px solid ${HAIRLINE_INK_7}`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ padding: '10px 16px 6px' }}>
      <SectionEyebrow label={text} />
    </div>
  );
}

export function ConversationList({ 
  onSelectConversation, 
  selectedConversationId,
  searchQuery = '',
  onNewConversation,
  filterType = 'all'
}: ConversationListProps) {
  const { conversations, loading, fetchConversations } = useMessagingContext();
  const { user } = useSupabaseSession();
  const { archivedConversations, hasArchived, unarchive, refetch: refetchArchived } = useArchivedConversations();
  const [showArchived, setShowArchived] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    try { return !localStorage.getItem('swipeHintDismissed'); }
    catch { return true; }
  });

  useEffect(() => {
    if (showSwipeHint && conversations.length > 0) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        try { localStorage.setItem('swipeHintDismissed', 'true'); }
        catch { /* silent fail */ }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, conversations.length]);

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_conversation_archive', {
        p_conversation_id: conversationId,
        p_archive: true,
      });
      if (error) throw error;
      await fetchConversations();
      await refetchArchived();
      toast.success('Chat archived');
    } catch {
      toast.error("Couldn't archive");
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    const success = await unarchive(conversationId);
    if (success) {
      await fetchConversations();
      toast.success('Chat unarchived');
    }
  };

  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  const handleDeleteConversation = (conversationId: string) => {
    setDeletingConversationId(conversationId);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingConversationId) return;
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', deletingConversationId)
        .eq('user_id', user?.id);
      if (error) throw error;
      await fetchConversations();
      toast.success('Conversation deleted');
    } catch {
      toast.error("Couldn't delete conversation");
    } finally {
      setDeletingConversationId(null);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    if (filterType === 'unread' && conversation.unread_count <= 0) return false;
    if (filterType === 'groups' && conversation.type !== 'group') return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const { name } = getConversationDisplay(conversation, user?.id);
    const lastMessage = conversation.last_message_preview?.toLowerCase() || '';
    
    return name.toLowerCase().includes(query) || lastMessage.includes(query);
  });

  if (loading) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map(i => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyState onNewConversation={onNewConversation} variant="all" />;
  }

  if (filteredConversations.length === 0) {
    if (searchQuery) {
      return <NoResults query={searchQuery} />;
    }
    return <EmptyState onNewConversation={onNewConversation} variant={filterType} />;
  }

  // Split into people (direct) and groups
  const directConversations = filteredConversations.filter(c => c.type === 'direct');
  const groupConversations = filteredConversations.filter(c => c.type !== 'direct');

  const renderConversationRow = (conversation: ConversationWithDetails, isArchived: boolean = false, index: number = 0, total: number = 0) => {
    const { name, avatarUrl, initials } = getConversationDisplay(conversation, user?.id);
    const isSelected = selectedConversationId === conversation.id;
    const hasUnread = conversation.unread_count > 0;
    const showDivider = index < total - 1;
    const isGroup = conversation.type !== 'direct';
    const isMuted = conversation.participants.find(p => p.user_id === user?.id)?.is_muted;
    // TODO: COACH badge requires is_coach field on public_profiles — not yet implemented

    return (
      <SwipeableConversationItem
        key={conversation.id}
        onArchive={() => isArchived 
          ? handleUnarchiveConversation(conversation.id) 
          : handleArchiveConversation(conversation.id)
        }
        onDelete={() => handleDeleteConversation(conversation.id)}
        isArchived={isArchived}
      >
        <div className="relative">
          <button
            onClick={() => {
              if (isArchived) handleUnarchiveConversation(conversation.id);
              onSelectConversation(conversation.id);
            }}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px',
              textAlign: 'left' as const, border: 'none', cursor: 'pointer',
              background: isSelected ? AMBER_TINT_06 : '#fff',
              borderLeft: isSelected ? `3px solid ${AMBER}` : '3px solid transparent',
              transition: 'background 0.1s',
              opacity: isArchived ? 0.7 : 1,
            }}
            className="active:!bg-[rgba(0,0,0,0.03)]"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {(conversation.type === 'club' || conversation.type === 'travel_company') && !avatarUrl ? (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: `linear-gradient(135deg, ${SUNDRIDGE_GREEN}, #004d33)`,
                  }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              ) : isGroup && !avatarUrl ? (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${AMBER}, #e07a0d)`,
                  }}
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <SquircleAvatar
                  src={avatarUrl}
                  alt={name}
                  size={52}
                  fallback={initials}
                  hideRing
                />
              )}
              
              {/* Unread count badge on avatar */}
              {hasUnread && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    top: -2, right: -2,
                    minWidth: 17, height: 17, borderRadius: 99,
                    background: AMBER, color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    border: `2px solid ${SHELL_BG}`,
                    padding: '0 3px',
                  }}
                >
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
              )}
            </div>

            {/* Text column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Top row */}
              <div className="flex items-center justify-between" style={{ gap: 4, marginBottom: 2 }}>
                <div className="flex items-center flex-1 min-w-0" style={{ gap: 6 }}>
                  <span
                    className="truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: hasUnread ? 700 : 600,
                      color: hasUnread ? INK : INK_DEEP,
                    }}
                  >
                    {name}
                  </span>
                  {isMuted && (
                    <BellOff size={11} style={{ color: INK_FAINT, flexShrink: 0 }} />
                  )}
                </div>
                <span
                  className="flex-shrink-0"
                  style={{
                    fontSize: 11, fontWeight: 500,
                    color: hasUnread ? AMBER : INK_FAINT,
                  }}
                >
                  {formatRelativeTime(conversation.last_message_at)}
                </span>
              </div>
              
              {/* Bottom row — preview */}
              <div className="flex items-center">
                <p
                  className="truncate flex-1"
                  style={{
                    fontSize: 13, margin: 0,
                    color: hasUnread ? '#334155' : INK_FAINT,
                    fontWeight: hasUnread ? 500 : 400,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  <ConversationTypingOrPreview 
                    conversationId={conversation.id}
                    preview={conversation.last_message_preview}
                    isActive={selectedConversationId === conversation.id}
                  />
                </p>
              </div>
            </div>

            {/* Unread accent bar */}
            {hasUnread && (
              <div
                className="flex-shrink-0"
                style={{
                  width: 3, height: 36, borderRadius: 99,
                  background: AMBER,
                }}
              />
            )}
          </button>
          
          {/* Hairline divider */}
          {showDivider && (
            <div style={{ height: '0.5px', background: HAIRLINE_INK_6, margin: '0 16px' }} />
          )}
        </div>
      </SwipeableConversationItem>
    );
  };

  const renderConversationList = (convos: ConversationWithDetails[], isArchived = false) => (
    <>
      {convos.map((conversation, index) => 
        renderConversationRow(conversation, isArchived, index, convos.length)
      )}
    </>
  );

  // When filtering by unread or groups, or searching, render flat list
  const showSections = filterType === 'all' && !searchQuery.trim();

  return (
    <div>
      {/* Swipe hint */}
      {showSwipeHint && filteredConversations.length > 0 && (
        <div
          className="flex items-center justify-center text-center"
          style={{
            margin: '4px 16px', padding: '8px 12px', borderRadius: 12,
            background: 'rgba(247,147,30,0.05)',
            border: `0.5px solid ${HAIRLINE_INK_7}`,
            fontSize: 13, color: INK_FAINT, gap: 8,
          }}
        >
          <span>← Swipe left to delete</span>
          <span>•</span>
          <span>Swipe right to archive →</span>
          <button 
            onClick={() => {
              setShowSwipeHint(false);
              try { localStorage.setItem('swipeHintDismissed', 'true'); }
              catch { /* silent */ }
            }}
            style={{ marginLeft: 8, fontWeight: 600, color: AMBER }}
          >
            Got it
          </button>
        </div>
      )}

      {showSections ? (
        <>
          {/* People section */}
          {directConversations.length > 0 && (
            <>
              <SectionLabel text="People" />
              <ConversationCard>
                {renderConversationList(directConversations)}
              </ConversationCard>
            </>
          )}

          {/* Groups & Clubs section */}
          {groupConversations.length > 0 && (
            <>
              <SectionLabel text="Groups & Clubs" />
              <ConversationCard>
                {renderConversationList(groupConversations)}
              </ConversationCard>
            </>
          )}
        </>
      ) : (
        <ConversationCard>
          {renderConversationList(filteredConversations)}
        </ConversationCard>
      )}

      {/* Archived section */}
      {hasArchived && (
        <div style={{ margin: '12px 16px 0' }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center justify-between w-full"
            style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(15,23,42,0.04)', border: `0.5px solid ${HAIRLINE_INK_7}`,
              cursor: 'pointer',
            }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <Archive size={16} style={{ color: INK_MUTE }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: INK_MUTE }}>Archived</span>
              <span style={{ fontSize: 12, color: INK_FAINT }}>({archivedConversations.length})</span>
            </div>
            {showArchived 
              ? <ChevronDown size={16} style={{ color: INK_FAINT }} /> 
              : <ChevronRight size={16} style={{ color: INK_FAINT }} />
            }
          </button>
          
          {showArchived && (
            <div style={{ marginTop: 8 }}>
              <ConversationCard>
                {renderConversationList(archivedConversations, true)}
              </ConversationCard>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!deletingConversationId} 
        onOpenChange={(open) => !open && setDeletingConversationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
