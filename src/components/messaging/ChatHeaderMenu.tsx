/**
 * ChatHeaderMenu - Kebab menu dropdown for DM and Group chats
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  User, 
  Search, 
  BellOff, 
  Image, 
  Trash2, 
  Ban, 
  Flag,
  Info,
  LogOut,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import { BlockUserDialog } from './BlockUserDialog';
import { ReportSheet } from './ReportSheet';
import type { ConversationWithDetails } from '@/types/messaging';

interface ChatHeaderMenuProps {
  conversation: ConversationWithDetails;
  isGroupChat: boolean;
  currentUserId: string;
  otherUserId?: string;
  onOpenGroupInfo?: () => void;
  onSearchInChat?: () => void;
  onViewSharedMedia?: () => void;
  onLeaveGroup?: () => void;
  onBack?: () => void;
  otherUserName?: string;
}

/* Icon box helper — 34×34 */
function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 34, height: 34, borderRadius: 10, background: bg }}
    >
      {children}
    </div>
  );
}

function Hairline() {
  return <div style={{ height: '0.5px', backgroundColor: 'rgba(15,23,42,0.06)' }} />;
}

export function ChatHeaderMenu({
  conversation,
  isGroupChat,
  currentUserId,
  otherUserId,
  onOpenGroupInfo,
  onSearchInChat,
  onViewSharedMedia,
  onLeaveGroup,
  onBack,
  otherUserName = 'User',
}: ChatHeaderMenuProps) {
  const navigate = useNavigate();
  
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showClearChatDialog, setShowClearChatDialog] = useState(false);
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
  
  const myParticipant = conversation.participants.find(p => p.user_id === currentUserId);
  const isMuted = myParticipant?.is_muted ?? false;

  const handleViewProfile = () => {
    haptic('light');
    if (otherUserId) navigate(`/profile/${otherUserId}`);
  };

  const handleToggleMute = async () => {
    haptic('light');
    try {
      const { error } = await supabase.rpc('toggle_conversation_mute', {
        p_conversation_id: conversation.id,
        p_mute: !isMuted,
      });
      if (error) throw error;
      toast.success(isMuted ? 'Unmuted' : 'Muted');
    } catch {
      toast.error("Couldn't update");
    }
  };

  const handleClearChatConfirmed = async () => {
    haptic('medium');
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('conversation_id', conversation.id);
      if (error) throw error;
      toast.success('Chat cleared');
      navigate(0);
    } catch {
      toast.error("Couldn't clear chat");
    }
  };

  const handleBlockUser = () => {
    haptic('medium');
    if (!otherUserId) return;
    setShowBlockDialog(true);
  };

  const handleReport = () => {
    haptic('light');
    setShowReportSheet(true);
  };

  const handleLeaveGroupConfirmed = async () => {
    haptic('medium');
    try {
      const { error } = await supabase.rpc('leave_group_conversation', {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      toast.success('Left group');
      onBack?.();
    } catch {
      toast.error("Couldn't leave group");
    }
  };

  const itemStyle = "flex items-center gap-[10px] px-[14px] py-[10px] min-h-[44px] cursor-pointer focus:bg-[rgba(0,0,0,0.03)]";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center flex-shrink-0 active:bg-[rgba(0,0,0,0.08)] transition-colors focus:outline-none"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'transparent', border: 'none',
            }}
          >
            <MoreVertical size={18} style={{ color: '#475569' }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="z-50 overflow-hidden p-0"
          style={{
            width: 224,
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(15,23,42,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          {isGroupChat ? (
            <>
              <DropdownMenuItem onClick={onOpenGroupInfo} className={itemStyle}>
                <IconBox bg="#EFF6FF"><Info size={16} style={{ color: '#3B82F6' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Group Info</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={onSearchInChat} className={itemStyle}>
                <IconBox bg="#F0FDF4"><Search size={16} style={{ color: '#22C55E' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Search in Chat</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={handleToggleMute} className={itemStyle}>
                {isMuted ? (
                  <>
                    <IconBox bg="rgba(247,147,30,0.10)"><Bell size={16} style={{ color: '#F7931E' }} /></IconBox>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Unmute Notifications</span>
                  </>
                ) : (
                  <>
                    <IconBox bg="#FFF7ED"><BellOff size={16} style={{ color: '#F97316' }} /></IconBox>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Mute Notifications</span>
                  </>
                )}
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={onViewSharedMedia} className={itemStyle}>
                <IconBox bg="#F5F3FF"><Image size={16} style={{ color: '#8B5CF6' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Shared Media</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={() => setShowLeaveGroupDialog(true)} className={itemStyle}>
                <IconBox bg="rgba(239,68,68,0.08)"><LogOut size={16} style={{ color: '#ef4444' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#ef4444' }}>Leave Group</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={handleReport} className={itemStyle}>
                <IconBox bg="rgba(239,68,68,0.08)"><Flag size={16} style={{ color: '#ef4444' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#ef4444' }}>Report Group</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleViewProfile} className={itemStyle}>
                <IconBox bg="#EFF6FF"><User size={16} style={{ color: '#3B82F6' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>View Profile</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={onSearchInChat} className={itemStyle}>
                <IconBox bg="#F0FDF4"><Search size={16} style={{ color: '#22C55E' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Search in Chat</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={handleToggleMute} className={itemStyle}>
                {isMuted ? (
                  <>
                    <IconBox bg="rgba(247,147,30,0.10)"><Bell size={16} style={{ color: '#F7931E' }} /></IconBox>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Unmute Notifications</span>
                  </>
                ) : (
                  <>
                    <IconBox bg="#FFF7ED"><BellOff size={16} style={{ color: '#F97316' }} /></IconBox>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Mute Notifications</span>
                  </>
                )}
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={onViewSharedMedia} className={itemStyle}>
                <IconBox bg="#F5F3FF"><Image size={16} style={{ color: '#8B5CF6' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Shared Media</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={() => setShowClearChatDialog(true)} className={itemStyle}>
                <IconBox bg="rgba(0,0,0,0.05)"><Trash2 size={16} style={{ color: '#1e293b' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Clear Chat</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={handleBlockUser} className={itemStyle}>
                <IconBox bg="rgba(239,68,68,0.08)"><Ban size={16} style={{ color: '#ef4444' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#ef4444' }}>Block User</span>
              </DropdownMenuItem>
              <Hairline />
              <DropdownMenuItem onClick={handleReport} className={itemStyle}>
                <IconBox bg="rgba(239,68,68,0.08)"><Flag size={16} style={{ color: '#ef4444' }} /></IconBox>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#ef4444' }}>Report</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Chat AlertDialog */}
      <AlertDialog open={showClearChatDialog} onOpenChange={setShowClearChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages for everyone in this conversation. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearChatConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group AlertDialog */}
      <AlertDialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave group?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to be re-added by a member to rejoin this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroupConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block User Dialog */}
      {otherUserId && (
        <BlockUserDialog
          open={showBlockDialog}
          onOpenChange={setShowBlockDialog}
          userId={otherUserId}
          userName={otherUserName}
          onBlocked={() => onBack?.()}
        />
      )}

      {/* Report Sheet */}
      <ReportSheet
        open={showReportSheet}
        onOpenChange={setShowReportSheet}
        reportedUserId={isGroupChat ? undefined : otherUserId}
        reportedConversationId={conversation.id}
        reportType={isGroupChat ? 'group' : 'user'}
      />
    </>
  );
}
