import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Pencil, UserPlus, LogOut, Archive,
  Shield, ShieldCheck, MoreVertical, Trash2, Image,
  Bell, BellOff, Flag, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || '');
  const [description, setDescription] = useState('');
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const currentUserParticipant = conversation.participants.find(
    p => p.user_id === currentUserId
  );
  const isAdmin = currentUserParticipant?.role === 'admin';
  const isCreator = conversation.created_by === currentUserId;
  const isMuted = currentUserParticipant?.is_muted || false;

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
      toast({ 
        title: 'Failed to update', 
        description: error.message,
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to update', 
        description: error.message,
        variant: 'destructive' 
      });
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
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error } = await supabase.rpc('update_group_info', {
        p_conversation_id: conversation.id,
        p_avatar_url: publicUrl,
      });
      
      if (error) throw error;
      
      toast({ title: 'Group photo updated' });
      onUpdate();
    } catch (error: any) {
      toast({ 
        title: 'Failed to upload', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleMute = async () => {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_muted: !isMuted })
        .eq('conversation_id', conversation.id)
        .eq('user_id', currentUserId);
        
      if (error) throw error;
      
      toast({ title: isMuted ? 'Notifications unmuted' : 'Notifications muted' });
      onUpdate();
    } catch (error: any) {
      toast({ 
        title: 'Failed to update', 
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to update', 
        description: error.message,
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to update', 
        description: error.message,
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to remove', 
        description: error.message,
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to leave', 
        description: error.message,
        variant: 'destructive' 
      });
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
      toast({ 
        title: 'Failed to archive', 
        variant: 'destructive' 
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMemberRole = (participant: ParticipantWithProfile) => {
    if (participant.user_id === conversation.created_by) return 'Creator';
    if (participant.role === 'admin') return 'Admin';
    return null;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-muted rounded-full">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold">Group Info</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Group Profile Section */}
        <div className="flex flex-col items-center py-6 border-b border-border">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={conversation.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {getInitials(conversation.name || 'Group')}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera size={16} />
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
          
          {/* Group Name */}
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
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{conversation.name}</h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Pencil size={16} className="text-muted-foreground" />
                  </button>
                )}
              </>
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mt-1">
            {conversation.participants.length} members
          </p>
          
          {/* Description */}
          <div className="mt-4 px-6 w-full">
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add group description..."
                  className="resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateDescription}>Save</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => isAdmin && setIsEditingDescription(true)}
                className={cn(
                  "w-full text-center text-sm",
                  description ? "text-muted-foreground" : "text-muted-foreground/60",
                  isAdmin && "hover:bg-muted rounded p-2"
                )}
              >
                {description || (isAdmin ? 'Add group description' : 'No description')}
              </button>
            )}
          </div>
        </div>
        
        {/* Media Section */}
        <button className="w-full flex items-center justify-between px-4 py-4 border-b border-border hover:bg-muted">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Image size={20} className="text-muted-foreground" />
            </div>
            <span className="font-medium">Media, Links, and Docs</span>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>
        
        {/* Settings Section */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <BellOff size={20} className="text-muted-foreground" />
              ) : (
                <Bell size={20} className="text-muted-foreground" />
              )}
              <span>Mute Notifications</span>
            </div>
            <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
          </div>
        </div>
        
        {/* Members Section */}
        <div className="py-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {conversation.participants.length} Members
            </h3>
            {isAdmin && (
              <button
                onClick={() => setIsAddMembersOpen(true)}
                className="flex items-center gap-1 text-primary text-sm font-medium"
              >
                <UserPlus size={16} />
                Add
              </button>
            )}
          </div>
          
          {conversation.participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.profile?.profile_photo_url || undefined} />
                  <AvatarFallback>
                    {getInitials(participant.profile?.display_name || participant.profile?.username || '?')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {participant.profile?.display_name || participant.profile?.username}
                    </span>
                    {participant.user_id === currentUserId && (
                      <span className="text-xs text-muted-foreground">You</span>
                    )}
                  </div>
                  {getMemberRole(participant) && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      {participant.user_id === conversation.created_by ? (
                        <ShieldCheck size={12} />
                      ) : (
                        <Shield size={12} />
                      )}
                      {getMemberRole(participant)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Member actions dropdown */}
              {isAdmin && participant.user_id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded-full">
                      <MoreVertical size={18} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {participant.role === 'admin' && participant.user_id !== conversation.created_by ? (
                      <DropdownMenuItem onClick={() => handleRemoveAdmin(participant.user_id)}>
                        <Shield size={16} className="mr-2" />
                        Dismiss as admin
                      </DropdownMenuItem>
                    ) : participant.role !== 'admin' && (
                      <DropdownMenuItem onClick={() => handleMakeAdmin(participant.user_id)}>
                        <ShieldCheck size={16} className="mr-2" />
                        Make group admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleRemoveMember(participant.user_id)}
                      className="text-destructive"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Remove from group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
        
        {/* Actions Section */}
        <div className="border-t border-border py-4 space-y-1">
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-foreground"
          >
            <Archive size={20} />
            <span>Archive Chat</span>
          </button>
          
          {!isCreator && (
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive"
            >
              <LogOut size={20} />
              <span>Exit Group</span>
            </button>
          )}
          
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-foreground">
            <Flag size={20} />
            <span>Report Group</span>
          </button>
        </div>
      </div>
      
      {/* Add Members Bottom Sheet */}
      <AddMembersSheet
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        conversationId={conversation.id}
        existingMemberIds={conversation.participants.map(p => p.user_id)}
        onMembersAdded={onUpdate}
      />
    </div>
  );
};
