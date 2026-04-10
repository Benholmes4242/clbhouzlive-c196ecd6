import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, Camera, Pencil, UserPlus, LogOut, Archive,
  Shield, ShieldCheck, MoreVertical, Trash2, Image,
  Bell, BellOff, Flag, ChevronRight, Users
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithDetails, ParticipantWithProfile } from '@/types/messaging';
import { AddMembersSheet } from './AddMembersSheet';
import { ReportSheet } from './ReportSheet';
import { SharedMediaGallery } from './SharedMediaGallery';

interface GroupInfoPageProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const GroupInfoPage: React.FC<GroupInfoPageProps> = ({
  conversation,
  currentUserId,
  onClose,
  onUpdate,
}) => {
  const currentUserParticipant = conversation.participants.find(
    p => p.user_id === currentUserId
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(
    currentUserParticipant?.is_muted ?? false
  );
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      toast.success('Group name updated');
      setIsEditingName(false);
      onUpdate();
    } catch (e: unknown) {
      toast.error('Failed to update', { description: (e as Error).message ?? 'An error occurred' });
    }
  };

  const handleUpdateDescription = async () => {
    try {
      const { error } = await supabase.rpc('update_group_info', {
        p_conversation_id: conversation.id,
        p_description: description.trim(),
      });
      if (error) throw error;
      toast.success('Description updated');
      setIsEditingDescription(false);
      onUpdate();
    } catch (e: unknown) {
      toast.error('Failed to update', { description: (e as Error).message ?? 'An error occurred' });
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
      toast.success('Group photo updated');
      onUpdate();
    } catch (e: unknown) {
      toast.error('Failed to upload', { description: (e as Error).message ?? 'An error occurred' });
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
      toast.success(newMuted ? 'Notifications muted' : 'Notifications unmuted');
      onUpdate();
    } catch (e: unknown) {
      setIsMutedLocal(!newMuted);
      toast.error('Failed to update');
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
      toast.success('Member is now an admin');
      onUpdate();
    } catch (e: unknown) {
      toast.error('Failed to update', { description: (e as Error).message ?? 'An error occurred' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('remove_group_member', {
        p_conversation_id: conversation.id,
        p_user_id: userId,
      });
      if (error) throw error;
      toast.success('Member removed');
      onUpdate();
    } catch (e: unknown) {
      toast.error('Failed to remove', { description: (e as Error).message ?? 'An error occurred' });
    }
  };

  const handleLeaveConfirmed = async () => {
    try {
      const { error } = await supabase.rpc('leave_group', {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      toast.success('You left the group');
      onClose();
    } catch (e: unknown) {
      toast.error('Failed to leave', { description: (e as Error).message ?? 'An error occurred' });
    } finally {
      setShowLeaveDialog(false);
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase.rpc('toggle_conversation_archive', {
        p_conversation_id: conversation.id,
        p_archive: true,
      });
      if (error) throw error;
      toast.success('Chat archived');
      onClose();
    } catch (e: unknown) {
      toast.error('Failed to archive');
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase.rpc('delete_group', {
        p_conversation_id: conversation.id,
      });
      if (error) throw error;
      toast.success('Group deleted');
      onClose();
    } catch (e: unknown) {
      toast.error('Failed to delete group', { description: (e as Error).message ?? 'An error occurred' });
    } finally {
      setShowDeleteDialog(false);
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
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#F8FAFC' }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          background: '#F8FAFC',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center justify-center active:scale-[0.97] transition-transform flex-shrink-0"
          style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', border: 'none' }}
        >
          <ChevronLeft size={20} style={{ color: '#475569' }} strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center">
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Group Info</span>
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 40px' }}>
        {/* ── Avatar + Name section ── */}
        <div className="flex flex-col items-center" style={{ padding: '24px 0 16px' }}>
          {/* Avatar */}
          <div className="relative">
            {conversation.avatar_url ? (
              <div style={{ filter: 'drop-shadow(0 4px 20px rgba(247,147,30,0.28))' }}>
                <SquircleAvatar
                  size={88}
                  src={conversation.avatar_url}
                  alt={conversation.name || 'Group'}
                  fallback={getInitials(conversation.name || 'Group')}
                  hideRing
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center"
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F7931E, #e07a0d)',
                  filter: 'drop-shadow(0 4px 20px rgba(247,147,30,0.28))',
                }}
              >
                <Users size={36} style={{ color: '#fff' }} />
              </div>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute flex items-center justify-center active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{
                    bottom: 2, right: 2,
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#F7931E', border: '2px solid #F8FAFC',
                  }}
                >
                  <Camera size={13} style={{ color: '#fff' }} />
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
          <div className="mt-4 flex items-center" style={{ gap: 8 }}>
            {isEditingName ? (
              <div className="flex items-center" style={{ gap: 8 }}>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                  className="text-center"
                  style={{
                    fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px',
                    background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 10, padding: '4px 12px', outline: 'none',
                  }}
                />
                <button
                  onClick={handleUpdateGroupName}
                  style={{
                    padding: '5px 14px', borderRadius: 10,
                    background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.25)',
                    fontSize: 13, fontWeight: 600, color: '#F7931E', cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  style={{
                    padding: '5px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.05)', border: 'none',
                    fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
                  {conversation.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="active:scale-[0.95] transition-transform"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Pencil size={14} style={{ color: '#F7931E' }} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Member count */}
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {conversation.participants.length} members
          </p>

          {/* Description */}
          {isEditingDescription ? (
            <div className="w-full mt-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add group description..."
                rows={3}
                style={{
                  fontSize: 13, color: '#1e293b', resize: 'none',
                  border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                  padding: '8px 12px', outline: 'none', background: '#fff',
                }}
              />
              <div className="flex justify-end" style={{ gap: 8 }}>
                <button
                  onClick={() => setIsEditingDescription(false)}
                  style={{
                    padding: '5px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.05)', border: 'none',
                    fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDescription}
                  style={{
                    padding: '5px 14px', borderRadius: 10,
                    background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.25)',
                    fontSize: 13, fontWeight: 600, color: '#F7931E', cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => isAdmin && setIsEditingDescription(true)}
              className="w-full text-center active:opacity-70 transition-opacity"
              style={{
                fontSize: 13, color: description ? '#94a3b8' : '#F7931E',
                marginTop: 2, background: 'none', border: 'none', cursor: isAdmin ? 'pointer' : 'default',
                padding: 4,
              }}
            >
              {description || (isAdmin ? 'Add group description' : 'No description')}
            </button>
          )}
        </div>

        {/* ── Settings card (Shared Media + Notifications) ── */}
        <div
          className="overflow-hidden"
          style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.07)',
            marginBottom: 14,
          }}
        >
          {/* Shared Media row */}
          <button
            onClick={() => setShowSharedMedia(true)}
            className="w-full flex items-center justify-between active:opacity-80 transition-opacity"
            style={{ padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.04)' }}
              >
                <Image size={17} style={{ color: '#64748b' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Shared Media</span>
            </div>
            <ChevronRight size={14} style={{ color: '#d1d5db' }} />
          </button>

          {/* Hairline */}
          <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />

          {/* Notifications row */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '13px 16px' }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.04)' }}
              >
                {isMuted ? <BellOff size={17} style={{ color: '#64748b' }} /> : <Bell size={17} style={{ color: '#64748b' }} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Notifications</span>
            </div>
            {/* Custom toggle */}
            <button
              onClick={handleToggleMute}
              className="relative"
              style={{
                width: 46, height: 26, borderRadius: 99,
                background: !isMuted ? '#F7931E' : '#e2e8f0',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s',
                  transform: !isMuted ? 'translateX(22px)' : 'translateX(3px)',
                }}
              />
            </button>
          </div>
        </div>

        {/* ── Members section ── */}
        <div style={{ marginBottom: 14 }}>
          {/* Header row */}
          <div className="flex items-center justify-between" style={{ padding: '0 4px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' as const }}>
              {conversation.participants.length} Members
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAddMembersOpen(true)}
                className="flex items-center active:opacity-70 transition-opacity"
                style={{ gap: 4, fontSize: 13, fontWeight: 600, color: '#F7931E', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <UserPlus size={14} style={{ color: '#F7931E' }} />
                Add
              </button>
            )}
          </div>

          {/* Members container */}
          <div
            className="overflow-hidden"
            style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)' }}
          >
            {conversation.participants.map((participant, idx) => (
              <React.Fragment key={participant.id}>
                {idx > 0 && <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />}
                <div className="flex items-center" style={{ gap: 12, padding: '10px 16px' }}>
                  {/* Avatar */}
                  <SquircleAvatar
                    size={44}
                    src={participant.profile?.profile_photo_url || undefined}
                    alt={participant.profile?.display_name || participant.profile?.username || '?'}
                    fallback={getInitials(participant.profile?.display_name || participant.profile?.username || '?')}
                    hideRing
                  />

                  {/* Info column */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Name + You + Role badge */}
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {participant.profile?.display_name || participant.profile?.username}
                      </span>
                      {participant.user_id === currentUserId && (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>You</span>
                      )}
                      {getMemberRole(participant) && (
                        <span
                          className="flex items-center flex-shrink-0"
                          style={{
                            gap: 3, fontSize: 10, fontWeight: 700,
                            color: '#d97706',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,166,35,0.18)',
                            borderRadius: 99, padding: '1px 6px',
                          }}
                        >
                          {participant.user_id === conversation.created_by ? <ShieldCheck size={11} /> : <Shield size={11} />}
                          {getMemberRole(participant)}
                        </span>
                      )}
                    </div>
                    {/* HCP + home club chips */}
                    {(participant.profile?.eg_handicap_index != null || participant.profile?.home_club) && (
                      <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                        {participant.profile?.eg_handicap_index != null && (
                          <span style={{
                            fontSize: '9.5px', fontWeight: 600, color: '#F7931E',
                            background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.25)',
                            borderRadius: 99, padding: '0px 5px',
                          }}>
                            HCP {participant.profile.eg_handicap_index}
                          </span>
                        )}
                        {participant.profile?.home_club && (
                          <span style={{
                            fontSize: '9.5px', fontWeight: 600, color: '#006747',
                            background: 'rgba(0,103,71,0.07)', border: '1px solid rgba(0,103,71,0.18)',
                            borderRadius: 99, padding: '0px 5px',
                          }}>
                            ⛳ {participant.profile.home_club}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Member action button */}
                  {isAdmin && participant.user_id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                          }}
                        >
                          <MoreVertical size={18} style={{ color: '#94a3b8' }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        style={{
                          background: '#fff', borderRadius: 14, width: 210,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
                          border: '1px solid rgba(0,0,0,0.07)',
                          padding: 0, overflow: 'hidden',
                        }}
                      >
                        {participant.role !== 'admin' && (
                          <DropdownMenuItem
                            onClick={() => participant.user_id && handleMakeAdmin(participant.user_id)}
                            className="flex items-center"
                            style={{ gap: 10, padding: '11px 14px' }}
                          >
                            <div
                              className="flex items-center justify-center flex-shrink-0"
                              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.10)' }}
                            >
                              <ShieldCheck size={14} style={{ color: '#F7931E' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Make group admin</span>
                          </DropdownMenuItem>
                        )}
                        {participant.role !== 'admin' && (
                          <div style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />
                        )}
                        <DropdownMenuItem
                          onClick={() => participant.user_id && handleRemoveMember(participant.user_id)}
                          className="flex items-center"
                          style={{ gap: 10, padding: '11px 14px' }}
                        >
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}
                          >
                            <Trash2 size={14} style={{ color: '#ef4444' }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#ef4444' }}>Remove from group</span>
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
        <div
          className="overflow-hidden"
          style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)' }}
        >
          {/* Archive Chat */}
          <button
            onClick={handleArchive}
            className="w-full flex items-center active:opacity-70 transition-opacity"
            style={{ gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.04)' }}
            >
              <Archive size={17} style={{ color: '#64748b' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Archive Chat</span>
          </button>

          {/* Exit Group (not if creator) */}
          {!isCreator && (
            <>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
              <button
                onClick={() => setShowLeaveDialog(true)}
                className="w-full flex items-center active:opacity-70 transition-opacity"
                style={{ gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.08)' }}
                >
                  <LogOut size={17} style={{ color: '#ef4444' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>Exit Group</span>
              </button>
            </>
          )}

          {/* Report Group */}
          <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
          <button
            onClick={() => setIsReportOpen(true)}
            className="w-full flex items-center active:opacity-70 transition-opacity"
            style={{ gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.08)' }}
            >
              <Flag size={17} style={{ color: '#ef4444' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>Report Group</span>
          </button>

          {/* Delete Group for Everyone (admin only) */}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-full flex items-center active:opacity-70 transition-opacity"
                style={{ gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.08)' }}
                >
                  <Trash2 size={17} style={{ color: '#ef4444' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>Delete Group for Everyone</span>
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
        existingMemberIds={conversation.participants.map(p => p.user_id).filter((id): id is string => id !== null)}
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

      {/* Leave group confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent
          style={{
            background: '#fff', borderRadius: 20, border: 'none',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            padding: '20px 20px 16px', maxWidth: 320,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Leave group?</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              You'll need to be re-added by a member to rejoin.
            </p>
          </div>
          <div className="flex" style={{ gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setShowLeaveDialog(false)}
              className="flex-1"
              style={{
                height: 42, borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.10)', background: '#fff',
                fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLeaveConfirmed}
              className="flex-1"
              style={{
                height: 42, borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.08)',
                fontSize: 14, fontWeight: 600, color: '#ef4444', cursor: 'pointer',
              }}
            >
              Leave
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent
          style={{
            background: '#fff', borderRadius: 20, border: 'none',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            padding: '20px 20px 16px', maxWidth: 320,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Delete group for everyone?</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              This cannot be undone. All messages and media will be permanently deleted.
            </p>
          </div>
          <div className="flex" style={{ gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1"
              style={{
                height: 42, borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.10)', background: '#fff',
                fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="flex-1"
              style={{
                height: 42, borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.08)',
                fontSize: 14, fontWeight: 600, color: '#ef4444', cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
