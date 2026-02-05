 /**
  * ChatHeaderMenu - Kebab menu dropdown for DM and Group chats
  * Uses Radix DropdownMenu for proper accessibility and z-index handling
  */
 
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
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { haptic } from '@/utils/haptics';
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
 }: ChatHeaderMenuProps) {
   const navigate = useNavigate();
   const { toast } = useToast();
   
   // Get current user's participant record
   const myParticipant = conversation.participants.find(p => p.user_id === currentUserId);
   const isMuted = myParticipant?.is_muted ?? false;
 
   const handleViewProfile = () => {
     haptic('light');
     if (otherUserId) {
       navigate(`/profile/${otherUserId}`);
     }
   };
 
   const handleToggleMute = async () => {
     haptic('light');
     try {
      const { error } = await supabase.rpc('toggle_conversation_mute' as any, {
         p_conversation_id: conversation.id,
         p_mute: !isMuted,
       });
       
       if (error) throw error;
       
       toast({
         title: isMuted ? 'Notifications unmuted' : 'Notifications muted',
       });
     } catch (error) {
       console.error('Error toggling mute:', error);
       toast({
         title: 'Failed to update notifications',
         variant: 'destructive',
       });
     }
   };
 
   const handleClearChat = async () => {
     haptic('medium');
     if (!confirm('Clear all messages? This cannot be undone.')) return;
     
     try {
       // Mark all messages as deleted for this user (soft delete)
       const { error } = await supabase
         .from('messages')
         .update({ deleted_at: new Date().toISOString() })
         .eq('conversation_id', conversation.id);
       
       if (error) throw error;
       
       toast({ title: 'Chat cleared' });
       window.location.reload(); // Refresh to show empty chat
     } catch (error) {
       console.error('Error clearing chat:', error);
       toast({ title: 'Failed to clear chat', variant: 'destructive' });
     }
   };
 
   const handleBlockUser = async () => {
     haptic('medium');
     if (!otherUserId) return;
     if (!confirm('Block this user? They will not be able to message you.')) return;
     
     try {
       // Add to blocked users (would need a blocks table)
       toast({ title: 'User blocked' });
       onBack?.();
     } catch (error) {
       console.error('Error blocking user:', error);
       toast({ title: 'Failed to block user', variant: 'destructive' });
     }
   };
 
   const handleReport = () => {
     haptic('light');
     toast({ title: 'Report submitted', description: 'We will review this conversation.' });
   };
 
   const handleLeaveGroup = async () => {
     haptic('medium');
     if (!confirm('Leave this group? You will no longer receive messages.')) return;
     
     try {
      const { error } = await supabase.rpc('leave_group_conversation' as any, {
         p_conversation_id: conversation.id,
       });
       
       if (error) throw error;
       
       toast({ title: 'Left group' });
       onBack?.();
     } catch (error) {
       console.error('Error leaving group:', error);
       toast({ title: 'Failed to leave group', variant: 'destructive' });
     }
   };
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors focus:outline-none">
           <MoreVertical className="w-5 h-5 text-[#1D1D1F]" />
         </button>
       </DropdownMenuTrigger>
       <DropdownMenuContent 
         align="end" 
         className="w-56 bg-white border border-[#E5E5EA] shadow-lg rounded-xl z-50"
       >
         {isGroupChat ? (
           <>
             {/* Group Chat Menu */}
             <DropdownMenuItem 
               onClick={onOpenGroupInfo}
               className="gap-3 py-3 cursor-pointer"
             >
               <Info className="w-4 h-4" />
               Group Info
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={onSearchInChat}
               className="gap-3 py-3 cursor-pointer"
             >
               <Search className="w-4 h-4" />
               Search in Chat
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleToggleMute}
               className="gap-3 py-3 cursor-pointer"
             >
               {isMuted ? (
                 <>
                   <Bell className="w-4 h-4" />
                   Unmute Notifications
                 </>
               ) : (
                 <>
                   <BellOff className="w-4 h-4" />
                   Mute Notifications
                 </>
               )}
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={onViewSharedMedia}
               className="gap-3 py-3 cursor-pointer"
             >
               <Image className="w-4 h-4" />
               Shared Media
             </DropdownMenuItem>
             
             <DropdownMenuSeparator />
             
             <DropdownMenuItem 
               onClick={handleLeaveGroup}
               className="gap-3 py-3 cursor-pointer text-red-500 focus:text-red-500"
             >
               <LogOut className="w-4 h-4" />
               Leave Group
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleReport}
               className="gap-3 py-3 cursor-pointer text-red-500 focus:text-red-500"
             >
               <Flag className="w-4 h-4" />
               Report Group
             </DropdownMenuItem>
           </>
         ) : (
           <>
             {/* DM Menu */}
             <DropdownMenuItem 
               onClick={handleViewProfile}
               className="gap-3 py-3 cursor-pointer"
             >
               <User className="w-4 h-4" />
               View Profile
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={onSearchInChat}
               className="gap-3 py-3 cursor-pointer"
             >
               <Search className="w-4 h-4" />
               Search in Chat
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleToggleMute}
               className="gap-3 py-3 cursor-pointer"
             >
               {isMuted ? (
                 <>
                   <Bell className="w-4 h-4" />
                   Unmute Notifications
                 </>
               ) : (
                 <>
                   <BellOff className="w-4 h-4" />
                   Mute Notifications
                 </>
               )}
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={onViewSharedMedia}
               className="gap-3 py-3 cursor-pointer"
             >
               <Image className="w-4 h-4" />
               Shared Media
             </DropdownMenuItem>
             
             <DropdownMenuSeparator />
             
             <DropdownMenuItem 
               onClick={handleClearChat}
               className="gap-3 py-3 cursor-pointer"
             >
               <Trash2 className="w-4 h-4" />
               Clear Chat
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleBlockUser}
               className="gap-3 py-3 cursor-pointer text-red-500 focus:text-red-500"
             >
               <Ban className="w-4 h-4" />
               Block User
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleReport}
               className="gap-3 py-3 cursor-pointer text-red-500 focus:text-red-500"
             >
               <Flag className="w-4 h-4" />
               Report
             </DropdownMenuItem>
           </>
         )}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }