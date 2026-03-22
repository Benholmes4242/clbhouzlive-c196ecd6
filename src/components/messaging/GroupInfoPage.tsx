import React, { useState, useRef } from 'react';
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
import { toast } from 'sonner';
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
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const insetDivider: React.CSSProperties = {
  height: 1,
  backgroundColor: 'rgba(0,0,0,0.05)',
};

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

  const handleRemoveAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('update_member_role', {
        p_conversation_id: conversation.id,
        p_user_id: userId,
        p_new_role: 'member',
      });
      if (error) throw error;
      toast.success('Admin rights removed');
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

  const handleLeaveGroup = () => {
    setShowLeaveDialog(true);
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

  const handleDeleteGroup = () => {
    setShowDeleteDialog(true);
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
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center px-[18px]"
        style={{
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: '#F8FAFC',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        >
          <ChevronLeft size={20} style={{ color: '#475569' }} strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-[17px] font-bold" style={{ color: '#0f172a' }}>
            Group Info
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-safe">
        {/* ── Profile section ── */}
        <div className="flex flex-col items-center pt-6 pb-4">
          {/* Avatar */}
          <div className="relative">
            <SquircleAvatar
              size={96}
              src={conversation.avatar_url || undefined}
              alt={conversation.name || 'Group'}
              fallback={getInitials(conversation.name || 'Group')}
              hideRing
              style={{ boxShadow: '0 4px 20px rgba(245,166,35,0.20)' }}
            />
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{ background: '#f59e0b', border: '2px solid #F8FAFC' }}
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
                <h2 className="text-[22px] font-extrabold" style={{ color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {conversation.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded active:scale-[0.95] transition-transform"
                  >
                    <Pencil size={18} className="text-muted-foreground" />
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-[13px] font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
                style={{ color: description ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground) / 0.6)' }}
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
              <Image size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>Shared Media</span>
            </div>
            <ChevronRight size={16} style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />
          </button>

          <div style={insetDivider} />

          <div className="flex items-center justify-between px-4 py-[14px]">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <BellOff size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              ) : (
                <Bell size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              )}
              <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>Notifications</span>
            </div>
            {/* Warm toggle */}
            <button
              onClick={handleToggleMute}
              className="relative w-[50px] h-[28px] rounded-full transition-colors duration-200"
              style={{
                background: isMuted ? 'hsl(var(--muted))' : '#f59e0b',
              }}
            >
              <div
                className="absolute top-[2px] w-6 h-6 bg-background rounded-full shadow-sm transition-transform duration-200"
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
              style={{ color: 'hsl(var(--muted-foreground) / 0.6)', letterSpacing: '0.05em' }}
            >
              {conversation.participants.length} Members
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAddMembersOpen(true)}
              className="flex items-center gap-1 text-[13px] font-semibold active:opacity-70 transition-opacity text-[hsl(35,80%,43%)]"
            >
              <UserPlus size={14} className="text-[hsl(35,80%,43%)]" />
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
                        <span className="text-[14px] font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          {participant.profile?.display_name || participant.profile?.username}
                        </span>
                        {participant.user_id === currentUserId && (
                          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            You
                          </span>
                        )}
                      </div>
                      {getMemberRole(participant) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[1px] rounded-lg"
                            style={{
                             color: '#d97706',
                               background: 'rgba(245, 158, 11, 0.08)',
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
                          <MoreVertical size={18} style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {participant.role === 'admin' && participant.user_id !== conversation.created_by ? (
                          <DropdownMenuItem onClick={() => participant.user_id && handleRemoveAdmin(participant.user_id)}>
                            <Shield size={16} className="mr-2" />
                            Dismiss as admin
                          </DropdownMenuItem>
                        ) : participant.role !== 'admin' && (
                          <DropdownMenuItem onClick={() => participant.user_id && handleMakeAdmin(participant.user_id)}>
                            <ShieldCheck size={16} className="mr-2" />
                            Make group admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => participant.user_id && handleRemoveMember(participant.user_id)}
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
            <Archive size={20} style={{ color: 'hsl(var(--foreground))' }} />
            <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>Archive Chat</span>
          </button>

          {!isCreator && (
            <>
               <div style={{ height: 1, backgroundColor: 'rgba(245, 158, 11, 0.06)' }} />
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
              >
                <LogOut size={20} style={{ color: 'hsl(var(--foreground))' }} />
                <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>Exit Group</span>
              </button>
            </>
          )}

           <div style={{ height: 1, backgroundColor: 'rgba(245, 158, 11, 0.06)' }} />
          <button
            onClick={() => setIsReportOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
          >
            <Flag size={20} style={{ color: 'hsl(var(--foreground))' }} />
            <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>Report Group</span>
          </button>

          {isAdmin && (
            <>
              <div style={{ height: 1, backgroundColor: 'rgba(245, 158, 11, 0.06)' }} />
              <button
                onClick={handleDeleteGroup}
                className="w-full flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
              >
                <Trash2 size={20} style={{ color: 'hsl(var(--destructive))' }} />
                <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--destructive))' }}>Delete Group for Everyone</span>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave group?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to be re-added by a member to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveConfirmed}
              className="bg-destructive text-destructive-foreground"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All messages and media will be permanently deleted.
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
};
