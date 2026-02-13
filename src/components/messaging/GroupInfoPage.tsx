import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Camera, Pencil, UserPlus, LogOut, Archive,
  Shield, ShieldCheck, MoreVertical, Trash2, Image,
  Bell, BellOff, Flag, ChevronRight
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithDetails, ParticipantWithProfile } from '@/types/messaging';
import { AddMembersSheet } from './AddMembersSheet';
import { ReportSheet } from './ReportSheet';
import { SharedMediaGallery } from './SharedMediaGallery';
import { cn } from '@/lib/utils';

interface GroupInfoPageProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

/* ── shared card style ── */
const warmCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid rgba(234,88,12,0.08)',
  borderRadius: 14,
};
const insetDivider: React.CSSProperties = {
  height: 1,
  marginLeft: 56,
  backgroundColor: 'rgba(0,0,0,0.04)',
};

export const GroupInfoPage: React.FC<GroupInfoPageProps> = ({
  conversation,
  currentUserId,
  onClose,
  onUpdate,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || '');
  const [description, setDescription] = useState('');
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(false);
  
  const currentUserParticipant = conversation.participants.find(
    p => p.user_id === currentUserId
  );
  const isAdmin = currentUserParticipant?.role === 'admin';
  const isCreator = conversation.created_by === currentUserId;
  const isMuted = currentUserParticipant?.is_muted || isMutedLocal;

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;
    try {
      const { error } = await supabase.rpc('update_group_info', {
        p_conversation_id: conversation.id,
        p_name: groupName.trim(),
      });
      if (error) throw error;
      toast({ title: 'Group name updated' });
      setIsEditingName(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateDescription = async () => {
    try {
      const { error } = await supabase.rpc('update_group_info', {
        p_conversation_id: conversation.id,
        p_description: description.trim(),
      });
      if (error) throw error;
      toast({ title: 'Description updated' });
      setIsEditingDescription(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${conversation.id}-${Date.now()}.${fileExt}`;
      const filePath = `group-avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error } = await supabase.rpc('update_group_info', {
        p_conversation_id: conversation.id,
        p_avatar_url: publicUrl,
      });
      if (error) throw error;
      toast({ title: 'Group photo updated' });
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMutedLocal(newMuted);
    try {
      const { error } = await supabase.rpc('toggle_conversation_mute', {
        p_conversation_id: conversation.id,
        p_mute: newMuted,
      });
      if (error) throw error;
      toast({ title: newMuted ? 'Notifications muted' : 'Notifications unmuted' });
      onUpdate();
    } catch (error: any) {
      setIsMutedLocal(!newMuted);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('update_member_role', {
        p_conversation_id: conversation.id,
        p_user_id: userId,
        p_new_role: 'admin',
      });
      if (error) throw error;
      toast({ title: 'Member is now an admin' });
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('update_member_role', {
        p_conversation_id: conversation.id,
        p_user_id: userId,
        p_new_role: 'member',
      });
      if (error) throw error;
      toast({ title: 'Admin rights removed' });
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('remove_group_member', {
        p_conversation_id: conversation.id,
        p_user_id: userId,
      });
      if (error) throw error;
      toast({ title: 'Member removed' });
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      const { error } = await supabase.rpc('leave_group', {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      toast({ title: 'You left the group' });
      navigate('/messages');
    } catch (error: any) {
      toast({ title: 'Failed to leave', description: error.message, variant: 'destructive' });
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase.rpc('toggle_conversation_archive', {
        p_conversation_id: conversation.id,
        p_archive: true,
      });
      if (error) throw error;
      toast({ title: 'Chat archived' });
      navigate('/messages');
    } catch (error: any) {
      toast({ title: 'Failed to archive', variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Delete this group for everyone? This cannot be undone.')) return;
    try {
      const { error } = await supabase.rpc('delete_group', {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      toast({ title: 'Group deleted' });
      navigate('/messages');
    } catch (error: any) {
      toast({ title: 'Failed to delete group', description: error.message, variant: 'destructive' });
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getMemberRole = (participant: ParticipantWithProfile) => {
    if (participant.user_id === conversation.created_by) return 'Group Admin';
    if (participant.role === 'admin') return 'Admin';
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF5EB 35%, #FFECD2 100%)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center px-[18px]"
        style={{
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'rgba(255,248,240,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <button
          onClick={onClose}
          className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
        >
          <ChevronLeft size={22} style={{ color: '#EA580C' }} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-[16px] font-semibold" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
            Group Info
          </span>
        </div>
        <div className="w-11" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-safe">
        {/* ── Profile section ── */}
        <div className="flex flex-col items-center pt-6 pb-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="rounded-full p-[3px]"
              style={{ background: 'rgba(255,255,255,0.7)' }}
            >
              <SquircleAvatar
                size={112}
                src={conversation.avatar_url || undefined}
                alt={conversation.name || 'Group'}
                fallback={getInitials(conversation.name || 'Group')}
                hideRing
              />
            </div>
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-[0.95] transition-transform disabled:opacity-50"
                  style={{ background: '#EA580C' }}
                >
                  <Camera size={16} className="text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Group name */}
          <div className="mt-4 flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-center text-xl font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={handleUpdateGroupName}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>Cancel</Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
                  {conversation.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded active:scale-[0.95] transition-transform"
                  >
                    <Pencil size={18} style={{ color: '#EA580C' }} />
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-[13px] font-medium mt-1" style={{ color: '#78716C' }}>
            {conversation.participants.length} members
          </p>

          {/* Description */}
          <div className="mt-3 w-full">
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add group description..."
                  className="resize-none text-[13px]"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleUpdateDescription}>Save</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => isAdmin && setIsEditingDescription(true)}
                className={cn(
                  "w-full text-center text-[13px] font-normal rounded-lg p-2",
                  isAdmin && "active:scale-[0.99] transition-transform"
                )}
                style={{ color: description ? '#78716C' : '#A8A29E' }}
              >
                {description || (isAdmin ? 'Add group description' : 'No description')}
              </button>
            )}
          </div>
        </div>

        {/* ── Media + Notifications card ── */}
        <div className="mt-4 overflow-hidden" style={warmCard}>
          <button
            onClick={() => setShowSharedMedia(true)}
            className="w-full flex items-center justify-between px-4 py-[14px] active:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <Image size={20} style={{ color: '#78716C' }} />
              <span className="text-[14px] font-medium" style={{ color: '#44403C' }}>Shared Media</span>
            </div>
            <ChevronRight size={16} style={{ color: '#A8A29E' }} />
          </button>

          <div style={insetDivider} />

          <div className="flex items-center justify-between px-4 py-[14px]">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <BellOff size={20} style={{ color: '#78716C' }} />
              ) : (
                <Bell size={20} style={{ color: '#78716C' }} />
              )}
              <span className="text-[14px] font-medium" style={{ color: '#44403C' }}>Notifications</span>
            </div>
            {/* Warm toggle */}
            <button
              onClick={handleToggleMute}
              className="relative w-[50px] h-[28px] rounded-full transition-colors duration-200"
              style={{
                background: isMuted ? 'rgba(120,90,60,0.15)' : '#EA580C',
              }}
            >
              <div
                className="absolute top-[2px] w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{
                  transform: isMuted ? 'translateX(2px)' : 'translateX(22px)',
                }}
              />
            </button>
          </div>
        </div>

        {/* ── Members section ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              className="text-[9px] font-medium uppercase"
              style={{ color: '#A8A29E', letterSpacing: '0.05em' }}
            >
              {conversation.participants.length} Members
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAddMembersOpen(true)}
                className="flex items-center gap-1 text-[13px] font-semibold active:opacity-70 transition-opacity"
                style={{ color: '#EA580C' }}
              >
                <UserPlus size={14} style={{ color: '#EA580C' }} />
                Add
              </button>
            )}
          </div>

          <div className="overflow-hidden" style={warmCard}>
            {conversation.participants.map((participant, idx) => (
              <React.Fragment key={participant.id}>
                {idx > 0 && <div style={insetDivider} />}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SquircleAvatar
                      size={40}
                      src={participant.profile?.profile_photo_url || undefined}
                      alt={participant.profile?.display_name || participant.profile?.username || '?'}
                      fallback={getInitials(participant.profile?.display_name || participant.profile?.username || '?')}
                      hideRing
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold truncate" style={{ color: '#1C1917' }}>
                          {participant.profile?.display_name || participant.profile?.username}
                        </span>
                        {participant.user_id === currentUserId && (
                          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: '#78716C' }}>
                            You
                          </span>
                        )}
                      </div>
                      {getMemberRole(participant) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[1px] rounded-lg"
                            style={{
                              color: '#EA580C',
                              background: 'rgba(234,88,12,0.08)',
                            }}
                          >
                            {participant.user_id === conversation.created_by ? (
                              <ShieldCheck size={11} />
                            ) : (
                              <Shield size={11} />
                            )}
                            {getMemberRole(participant)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member actions */}
                  {isAdmin && participant.user_id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full active:opacity-70 transition-opacity">
                          <MoreVertical size={18} style={{ color: '#A8A29E' }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {participant.role === 'admin' && participant.user_id !== conversation.created_by ? (
                          <DropdownMenuItem onClick={() => handleRemoveAdmin(participant.user_id!)}>
                            <Shield size={16} className="mr-2" />
                            Dismiss as admin
                          </DropdownMenuItem>
                        ) : participant.role !== 'admin' && (
                          <DropdownMenuItem onClick={() => handleMakeAdmin(participant.user_id!)}>
                            <ShieldCheck size={16} className="mr-2" />
                            Make group admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(participant.user_id!)}
                          className="text-destructive"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Remove from group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Actions card ── */}
        <div className="mt-4 mb-8 overflow-hidden" style={warmCard}>
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
          >
            <Archive size={20} style={{ color: '#44403C' }} />
            <span className="text-[14px] font-medium" style={{ color: '#44403C' }}>Archive Chat</span>
          </button>

          {!isCreator && (
            <>
              <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.04)' }} />
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
              >
                <LogOut size={20} style={{ color: '#44403C' }} />
                <span className="text-[14px] font-medium" style={{ color: '#44403C' }}>Exit Group</span>
              </button>
            </>
          )}

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.04)' }} />
          <button
            onClick={() => setIsReportOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
          >
            <Flag size={20} style={{ color: '#44403C' }} />
            <span className="text-[14px] font-medium" style={{ color: '#44403C' }}>Report Group</span>
          </button>

          {isAdmin && (
            <>
              <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.04)' }} />
              <button
                onClick={handleDeleteGroup}
                className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
              >
                <Trash2 size={20} style={{ color: '#DC2626' }} />
                <span className="text-[14px] font-medium" style={{ color: '#DC2626' }}>Delete Group for Everyone</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sheets / Modals */}
      <AddMembersSheet
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        conversationId={conversation.id}
        existingMemberIds={conversation.participants.map(p => p.user_id)}
        onMembersAdded={onUpdate}
      />

      <ReportSheet
        open={isReportOpen}
        onOpenChange={(open) => !open && setIsReportOpen(false)}
        reportedConversationId={conversation.id}
        reportType="group"
      />

      {showSharedMedia && (
        <SharedMediaGallery
          conversationId={conversation.id}
          onClose={() => setShowSharedMedia(false)}
        />
      )}
    </div>
  );
};
