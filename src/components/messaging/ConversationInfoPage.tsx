 import React, { useState, useRef } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { 
   ChevronLeft, Camera, Archive, Flag, ShieldOff, ShieldCheck,
   Bell, BellOff, ChevronRight, Image, Trash2
 } from 'lucide-react';
 import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
 import { Switch } from '@/components/ui/switch';
 import { useToast } from '@/hooks/use-toast';
 import { useBlockActions } from '@/hooks/useBlockActions';
 import { supabase } from '@/integrations/supabase/client';
 import { ConversationWithDetails } from '@/types/messaging';
 
 interface ConversationInfoPageProps {
   conversation: ConversationWithDetails;
   currentUserId: string;
   onClose: () => void;
   onUpdate: () => void;
 }
 
 export const ConversationInfoPage: React.FC<ConversationInfoPageProps> = ({
   conversation,
   currentUserId,
   onClose,
   onUpdate,
 }) => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { blockUser, loading: blockLoading } = useBlockActions({ currentUserId });
   
   // Get the other user in DM
   const otherParticipant = conversation.participants.find(
     p => p.user_id !== currentUserId
   );
   const otherUserId = otherParticipant?.user_id;
   const otherProfile = otherParticipant?.profile;
   
   const displayName = otherProfile?.display_name || otherProfile?.username || 'Unknown';
   const avatarUrl = otherProfile?.profile_photo_url;
   
   const currentUserParticipant = conversation.participants.find(
     p => p.user_id === currentUserId
   );
   const isMuted = currentUserParticipant?.is_muted || false;
 
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
 
   const handleDeleteChat = async () => {
     if (!confirm('Delete this conversation? This cannot be undone.')) return;
     
     try {
       // Archive/delete the conversation for this user
       const { error } = await supabase.rpc('toggle_conversation_archive', {
         p_conversation_id: conversation.id,
         p_archive: true,
       });
       
       if (error) throw error;
       
       toast({ title: 'Conversation deleted' });
       navigate('/messages');
     } catch (error: any) {
       toast({ 
         title: 'Failed to delete', 
         variant: 'destructive' 
       });
     }
   };
 
   const handleBlockUser = async () => {
     if (!otherUserId) return;
     if (!confirm(`Block ${displayName}? They won't be able to message you.`)) return;
     
     const success = await blockUser(otherUserId);
     if (success) {
       navigate('/messages');
     }
   };
 
   const handleReportUser = () => {
     toast({ title: 'Report submitted', description: 'We will review this conversation.' });
   };
 
   const handleViewProfile = () => {
     if (otherProfile?.username) {
       navigate(`/@${otherProfile.username}`);
     }
   };
 
   const getInitials = (name: string) => {
     return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
   };
 
   return (
     <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col">
       {/* Header */}
       <div className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#E5E5EA]">
         <div className="flex items-center h-14 px-4">
           <button 
             onClick={onClose}
             className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-[#E5E5EA] transition-colors"
           >
             <ChevronLeft size={24} className="text-[#1D1D1F]" />
           </button>
           <div className="flex-1 flex justify-center">
             <span className="text-lg font-semibold text-[#1D1D1F]">Chat Info</span>
           </div>
           {/* Spacer for centering */}
           <div className="w-10" />
         </div>
       </div>
       
       <div className="flex-1 overflow-y-auto">
         {/* Profile Section */}
         <div className="flex flex-col items-center py-8 bg-gradient-to-b from-[#E5E5EA]/30 to-transparent">
           <SquircleAvatar
             size={112}
             src={avatarUrl || undefined}
             alt={displayName}
             fallback={getInitials(displayName)}
             hideRing
           />
           
           <h2 className="mt-4 text-xl font-semibold text-[#1D1D1F]">{displayName}</h2>
           {otherProfile?.username && (
             <p className="text-[#8E8E93] text-sm mt-1">@{otherProfile.username}</p>
           )}
           
           {/* View Profile Button */}
           <button
             onClick={handleViewProfile}
             className="mt-4 px-6 py-2 bg-[#1D1D1F] text-white text-sm font-medium rounded-full active:opacity-80 transition-opacity"
           >
             View Profile
           </button>
         </div>
         
         {/* Media Section */}
         <button className="w-full flex items-center justify-between px-4 py-4 border-b border-[#E5E5EA] hover:bg-[#E5E5EA]/50 transition-colors">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-[#E5E5EA] rounded-lg">
               <Image size={20} className="text-[#8E8E93]" />
             </div>
             <span className="font-medium text-[#1D1D1F]">Media, Links, and Docs</span>
           </div>
           <ChevronRight size={20} className="text-[#8E8E93]" />
         </button>
         
         {/* Settings Section */}
         <div className="border-b border-[#E5E5EA]">
           <div className="flex items-center justify-between px-4 py-4">
             <div className="flex items-center gap-3">
               {isMuted ? (
                 <BellOff size={20} className="text-[#8E8E93]" />
               ) : (
                 <Bell size={20} className="text-[#8E8E93]" />
               )}
               <span className="text-[#1D1D1F]">Mute Notifications</span>
             </div>
             <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
           </div>
         </div>
         
         {/* Actions Section */}
         <div className="mt-6 mx-4 space-y-2">
           <button
             onClick={handleArchive}
             className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl active:bg-[#E5E5EA] transition-colors"
           >
             <Archive size={20} className="text-[#8E8E93]" />
             <span className="text-[#1D1D1F]">Archive Chat</span>
           </button>
           
           <button
             onClick={handleBlockUser}
             disabled={blockLoading}
             className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl active:bg-[#E5E5EA] transition-colors disabled:opacity-50"
           >
             <ShieldOff size={20} className="text-[#FF3B30]" />
             <span className="text-[#FF3B30]">Block {displayName}</span>
           </button>
           
           <button
             onClick={handleReportUser}
             className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl active:bg-[#E5E5EA] transition-colors"
           >
             <Flag size={20} className="text-[#FF9500]" />
             <span className="text-[#FF9500]">Report</span>
           </button>
           
           <button
             onClick={handleDeleteChat}
             className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl active:bg-[#E5E5EA] transition-colors"
           >
             <Trash2 size={20} className="text-[#FF3B30]" />
             <span className="text-[#FF3B30]">Delete Conversation</span>
           </button>
         </div>
         
         {/* Bottom padding */}
         <div className="h-8" />
       </div>
     </div>
   );
 };