import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Reply, Pencil, Trash2, MapPin, ExternalLink, Check, CheckCheck, Copy, Forward, Star } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CountryFlag from '@/components/ui/country-flag';
import { cn } from '@/lib/utils';
import { MessageReactions } from './MessageReactions';
import { MediaMessage } from './MediaMessage';
import { SharedContentCard } from './SharedContentCard';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { SystemMessage, type SystemMessageMetadata } from './SystemMessage';
import type { MessageWithSender, SharedCourse } from '@/types/messaging';
import type { Reaction } from '@/hooks/useMessageReactions';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showSenderInfo: boolean;
  replyToMessage?: MessageWithSender | null;
  reactions?: Reaction[];
  currentUserId?: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReaction?: (emoji: string) => void;
  onForward?: () => void;
  isHighlighted?: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function ReadReceipt({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'read') {
    return <CheckCheck className="w-3 h-3" style={{ color: 'rgba(247,147,30,0.85)' }} />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3" style={{ color: '#94a3b8' }} />;
  }
  return <Check className="w-3 h-3" style={{ color: '#94a3b8' }} />;
}

/** Context menu icon box */
function CtxIconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: 32, height: 32, borderRadius: 9, background: bg }}
    >
      {children}
    </div>
  );
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSenderInfo,
  replyToMessage,
  reactions = [],
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onForward,
  isHighlighted,
}: MessageBubbleProps) {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasFetchedSaved, setHasFetchedSaved] = useState(false);

  const fetchSavedState = async () => {
    if (hasFetchedSaved || !message.id) return;
    const { data, error } = await supabase.rpc('is_message_saved', { p_message_id: message.id });
    if (!error && data) setIsSaved(true);
    setHasFetchedSaved(true);
  };

  // Handle system messages first
  if (message.message_type === 'system') {
    return (
      <div className="py-1">
        <SystemMessage
          content={message.content}
          metadata={message.media_metadata as unknown as SystemMessageMetadata | null}
          timestamp={message.created_at}
        />
      </div>
    );
  }

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const senderInitials = senderName.substring(0, 2).toUpperCase();
  const deliveryStatus = 'sent' as const;

  // Course share card
  if (message.message_type === 'course_share' && message.media_metadata) {
    const course = message.media_metadata as unknown as SharedCourse;
    const communityRating = course.rating;

    const courseCardContent = (
      <div style={{ display: 'flex', gap: 8, justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
        {/* Avatar for received */}
        {!isOwnMessage && showSenderInfo && (
          <SquircleAvatar src={message.sender?.profile_photo_url} alt={senderName} size={28} fallback={senderInitials} hideRing className="flex-shrink-0" />
        )}
        {!isOwnMessage && !showSenderInfo && <div style={{ width: 28, flexShrink: 0 }} />}

        <div className="flex flex-col" style={{ maxWidth: 260, alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
          {!isOwnMessage && showSenderInfo && (
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: 3, paddingLeft: 1 }}>
              {senderName}
            </span>
          )}

          <button
            onClick={() => navigate(course.course_slug ? `/courses/${course.course_slug}` : `/courses/${course.course_id}`)}
            className="w-full text-left active:scale-[0.98] transition-transform"
            style={{
              maxWidth: 260,
              borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              background: '#fff',
            }}
          >
            {/* Course Image */}
            <div className="relative" style={{ height: 140, overflow: 'hidden' }}>
              {course.course_image_url ? (
                <img src={course.course_image_url} alt={course.course_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(247,147,30,0.15)' }}>
                  <span className="text-4xl">⛳</span>
                </div>
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%)' }} />
              
              {/* Course name on image */}
              <span className="absolute" style={{ bottom: 10, left: 12, right: 12, fontSize: '13.5px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                {course.course_name}
              </span>
              
              {/* Rating badge */}
              {communityRating && communityRating > 0 && (
                <span
                  className="absolute flex items-center"
                  style={{
                    top: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    borderRadius: 8, padding: '3px 8px',
                    fontSize: 11, fontWeight: 700, color: '#fff', gap: 3,
                  }}
                >
                  ⭐ {communityRating.toFixed(1)}
                </span>
              )}

              {/* Country/rank badge */}
              {(course.world_rank || course.country_rank) && course.country_rank && course.country_rank <= 100 && (() => {
                const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(course.country_code || '');
                const isUSA = ['United States', 'USA'].includes(course.country_code || '');
                const flagCountry = isGBI ? 'Britain & Ireland' : isUSA ? 'USA' : (course.country_code || 'Britain & Ireland');
                return (
                  <div className="absolute top-2 left-2 glass-badge-tight shadow-lg">
                    <CountryFlag country={flagCountry} size="md" />
                    <span className="text-white">#{course.country_rank}</span>
                  </div>
                );
              })()}
            </div>

            {/* Info section */}
            <div style={{ padding: '10px 12px' }}>
              {course.location && (
                <div className="flex items-center" style={{ gap: 4, marginBottom: 8 }}>
                  <MapPin size={11} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>{course.location}</span>
                </div>
              )}
              
              {/* View Course button */}
              <div
                className="w-full flex items-center justify-center"
                style={{
                  gap: 6, padding: '7px 0', borderRadius: 10,
                  background: 'rgba(247,147,30,0.08)',
                  border: '1px solid rgba(247,147,30,0.22)',
                  fontSize: '12.5px', fontWeight: 600, color: '#F7931E',
                }}
              >
                View Course
                <ExternalLink size={12} />
              </div>
              
              {/* Timestamp */}
              <div className="flex items-center justify-end" style={{ gap: 3, marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
                {message.is_edited && <span style={{ fontStyle: 'italic' }}>edited</span>}
                <span>{formatMessageTime(message.created_at)}</span>
                {isOwnMessage && <ReadReceipt status={deliveryStatus} />}
              </div>
            </div>
          </button>

          {reactions.length > 0 && (
            <MessageReactions
              reactions={reactions}
              currentUserId={currentUserId}
              onToggleReaction={(emoji) => onToggleReaction?.(emoji)}
              isOwnMessage={isOwnMessage}
            />
          )}
        </div>
      </div>
    );

    return (
      <div className="py-1">
        <ContextMenu onOpenChange={(open) => { if (open) fetchSavedState(); }}>
          <ContextMenuTrigger asChild>{courseCardContent}</ContextMenuTrigger>
          <ContextMenuContent
            style={{
              background: '#fff', borderRadius: 16, width: 220,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              border: 'none', padding: 0, overflow: 'hidden',
            }}
          >
            <ContextMenuItem onClick={onReply} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
              <CtxIconBox bg="rgba(0,0,0,0.05)"><Reply size={14} style={{ color: '#475569' }} /></CtxIconBox>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Reply</span>
            </ContextMenuItem>
            {isOwnMessage && (
              <>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
                <ContextMenuItem onClick={onEdit} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
                  <CtxIconBox bg="rgba(0,0,0,0.05)"><Pencil size={14} style={{ color: '#475569' }} /></CtxIconBox>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Edit</span>
                </ContextMenuItem>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
                <ContextMenuItem onClick={onDelete} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
                  <CtxIconBox bg="rgba(239,68,68,0.08)"><Trash2 size={14} style={{ color: '#ef4444' }} /></CtxIconBox>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>Delete</span>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  const isMediaMessage = message.message_type === 'image' || message.message_type === 'video';
  const isVoiceNote = message.message_type === 'voice';
  const isSharedContent = message.message_type === 'tee_time' || message.message_type === 'moment_share';

  const handleEmojiSelect = (emoji: string) => {
    haptic('light');
    onToggleReaction?.(emoji);
    setShowEmojiPicker(false);
  };

  const handleCopy = () => {
    haptic('light');
    if (message.content) {
      try {
        navigator.clipboard.writeText(message.content);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Could not copy to clipboard');
      }
    }
  };

  const handleStar = async () => {
    haptic('light');
    try {
      const { data, error } = await supabase.rpc('toggle_saved_message', { p_message_id: message.id });
      if (error) throw error;
      const nowSaved = data === true;
      setIsSaved(nowSaved);
      toast.success(nowSaved ? "Saved to Caddie's Picks ⛳" : "Removed from Caddie's Picks");
    } catch {
      toast.error('Failed to save message');
    }
  };

  const bubbleContent = (
    <div style={{ display: 'flex', gap: 8, justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
      {/* Avatar for received */}
      {!isOwnMessage && showSenderInfo && (
        <SquircleAvatar src={message.sender?.profile_photo_url} alt={senderName} size={28} fallback={senderInitials} hideRing className="flex-shrink-0" />
      )}
      {!isOwnMessage && !showSenderInfo && <div style={{ width: 28, flexShrink: 0 }} />}

      <div className="flex flex-col" style={{ maxWidth: '72%', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
        {/* Sender name + chips for groups */}
        {!isOwnMessage && showSenderInfo && (
          <div className="flex items-center" style={{ gap: 5, marginBottom: 3, paddingLeft: 1, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
              {senderName}
            </span>
            {message.sender?.eg_handicap_index != null && (
              <span style={{
                fontSize: '9.5px', fontWeight: 600, color: '#F7931E',
                background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.25)',
                borderRadius: 99, padding: '0px 5px',
              }}>
                HCP {message.sender.eg_handicap_index}
              </span>
            )}
            {message.sender?.home_club && (
              <span style={{
                fontSize: '9.5px', fontWeight: 600, color: '#006747',
                background: 'rgba(0,103,71,0.07)', border: '1px solid rgba(0,103,71,0.18)',
                borderRadius: 99, padding: '0px 5px',
              }}>
                ⛳ {message.sender.home_club}
              </span>
            )}
          </div>
        )}

        {/* Reply quote */}
        {replyToMessage && (
          <div
            style={{
              padding: '4px 10px',
              background: 'rgba(0,0,0,0.04)', borderRadius: 10,
              borderLeft: '2px solid #F7931E',
              maxWidth: '70%', marginBottom: 4,
              fontSize: 11, color: '#94a3b8',
            }}
          >
            <span style={{ fontWeight: 600 }}>{replyToMessage.sender?.display_name || 'You'}</span>
            <p className="truncate" style={{ margin: 0 }}>{replyToMessage.content || 'Media'}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          style={{
            padding: '9px 13px',
            borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            ...(isOwnMessage ? {
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.25)',
            } : {
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }),
          }}
        >
          {/* Media content */}
          {isMediaMessage && message.media_url && (
            <MediaMessage 
              type={message.message_type as 'image' | 'video'} 
              url={message.media_url} 
              className="mb-2"
            />
          )}

          {/* Voice note */}
          {isVoiceNote && message.media_url && (
            <VoiceNotePlayer
              audioUrl={message.media_url}
              duration={(message.media_metadata as Record<string, unknown>)?.duration as number | undefined}
              isOwn={isOwnMessage}
            />
          )}

          {/* Shared golf content */}
          {isSharedContent && message.media_metadata && (
            <SharedContentCard
              messageType={message.message_type}
              metadata={message.media_metadata}
              isOwnMessage={isOwnMessage}
              className="mb-2"
            />
          )}

          {/* Message text */}
          {message.content && (
            <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp + Read receipt — OUTSIDE the bubble */}
        <div className="flex items-center" style={{
          gap: 3, marginTop: 3,
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          fontSize: 10, color: '#94a3b8',
        }}>
          {message.is_edited && <span style={{ fontStyle: 'italic' }}>edited</span>}
          <span>{formatMessageTime(message.created_at)}</span>
          {isOwnMessage && <ReadReceipt status={deliveryStatus} />}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggleReaction={(emoji) => onToggleReaction?.(emoji)}
            isOwnMessage={isOwnMessage}
          />
        )}
      </div>
    </div>
  );

  return (
    <div style={{ borderRadius: 16, transition: 'background 0.3s', background: isHighlighted ? 'rgba(247,147,30,0.12)' : 'transparent' }}>
    <ContextMenu onOpenChange={(open) => { if (open) fetchSavedState(); }}>
      <ContextMenuTrigger asChild>{bubbleContent}</ContextMenuTrigger>
      <ContextMenuContent
        className="z-50"
        style={{
          background: '#fff', borderRadius: 16, width: 220,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          border: 'none', padding: 0, overflow: 'hidden',
        }}
      >
        {/* Message preview */}
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' as const }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{formatMessageTime(message.created_at)}</div>
          {message.content && (
            <p style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: 1.4, margin: 0 }}>
              {message.content.length > 60 ? message.content.slice(0, 60) + '…' : message.content}
            </p>
          )}
        </div>

        {/* Quick reactions row */}
        <div className="flex items-center justify-around" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          {['👍', '🔥', '⛳', '😂', '❤️', '🏌️'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 18 }}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Actions */}
        <ContextMenuItem onClick={() => { haptic('light'); onReply(); }} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
          <CtxIconBox bg="rgba(0,0,0,0.05)"><Reply size={14} style={{ color: '#475569' }} /></CtxIconBox>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Reply</span>
        </ContextMenuItem>
        
        <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
        
        <ContextMenuItem onClick={handleCopy} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
          <CtxIconBox bg="rgba(0,0,0,0.05)"><Copy size={14} style={{ color: '#475569' }} /></CtxIconBox>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Copy</span>
        </ContextMenuItem>
        
        {onForward && (
          <>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
            <ContextMenuItem onClick={() => { haptic('light'); onForward(); }} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
              <CtxIconBox bg="rgba(0,0,0,0.05)"><Forward size={14} style={{ color: '#475569' }} /></CtxIconBox>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Forward</span>
            </ContextMenuItem>
          </>
        )}
        
        <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
        
        <ContextMenuItem onClick={handleStar} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
          <CtxIconBox bg="rgba(0,0,0,0.05)">
            <Star size={14} style={{ color: isSaved ? '#F7931E' : '#475569' }} className={isSaved ? 'fill-current' : ''} />
          </CtxIconBox>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{isSaved ? "Remove from Picks" : "Save"}</span>
        </ContextMenuItem>
        
        {isOwnMessage && (
          <>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
            <ContextMenuItem onClick={() => { haptic('light'); onEdit(); }} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
              <CtxIconBox bg="rgba(0,0,0,0.05)"><Pencil size={14} style={{ color: '#475569' }} /></CtxIconBox>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>Edit</span>
            </ContextMenuItem>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
            <ContextMenuItem onClick={() => { haptic('medium'); onDelete(); }} className="flex items-center gap-3 px-4 py-[11px] min-h-[44px]">
              <CtxIconBox bg="rgba(239,68,68,0.08)"><Trash2 size={14} style={{ color: '#ef4444' }} /></CtxIconBox>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>Delete</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
    </div>
  );
}
