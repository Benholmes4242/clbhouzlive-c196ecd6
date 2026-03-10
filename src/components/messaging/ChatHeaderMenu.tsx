 /**
  * ChatHeaderMenu - Kebab menu dropdown for DM and Group chats
  * Uses Radix DropdownMenu for proper accessibility and z-index handling
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
   DropdownMenuSeparator,
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
      // TODO: toggle_conversation_mute RPC needs to be added to Supabase generated types
      const { error } = await (supabase.rpc as Function)('toggle_conversation_mute', {
         p_conversation_id: conversation.id,
         p_mute: !isMuted,
       });
       
       if (error) throw error;
       
       toast.success(isMuted ? 'Unmuted' : 'Muted');
     } catch {
       toast.error("Couldn't update");
     }
   };
 
   // WARNING: This operation sets deleted_at on ALL messages in the conversation,
   // affecting ALL participants — not just the current user.
   // A per-user soft-delete (e.g. a user_id column on deleted messages) is needed
   // to scope this correctly. Do not ship a "Clear Chat" UI without fixing this first.
   const handleClearChatConfirmed = async () => {
     haptic('medium');
     try {
       const { error } = await supabase
         .from('messages')
         .update({ deleted_at: new Date().toISOString() })
         .eq('conversation_id', conversation.id);
       
       if (error) throw error;
       
       toast.success('Chat cleared');
       navigate(0); // React Router reload
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
      // TODO: leave_group_conversation RPC needs to be added to Supabase generated types
      const { error } = await (supabase.rpc as Function)('leave_group_conversation', {
         p_conversation_id: conversation.id,
       });
       
       if (error) throw error;
       
       toast.success('Left group');
       onBack?.();
     } catch {
       toast.error("Couldn't leave group");
     }
   };
 
   return (
     <>
       <DropdownMenu>
       <DropdownMenuTrigger asChild>
          <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-primary/5 transition-colors focus:outline-none">
            <MoreVertical className="w-5 h-5 text-primary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border border-border shadow-lg rounded-xl z-50"
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
               onClick={() => setShowLeaveGroupDialog(true)}
               className="gap-3 py-3 cursor-pointer text-destructive focus:text-destructive"
             >
               <LogOut className="w-4 h-4" />
               Leave Group
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleReport}
               className="gap-3 py-3 cursor-pointer text-destructive focus:text-destructive"
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
               onClick={() => setShowClearChatDialog(true)}
               className="gap-3 py-3 cursor-pointer"
             >
               <Trash2 className="w-4 h-4" />
               Clear Chat
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleBlockUser}
               className="gap-3 py-3 cursor-pointer text-destructive focus:text-destructive"
             >
               <Ban className="w-4 h-4" />
               Block User
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               onClick={handleReport}
               className="gap-3 py-3 cursor-pointer text-destructive focus:text-destructive"
             >
               <Flag className="w-4 h-4" />
               Report
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
               This will permanently delete all messages in this conversation. This cannot be undone.
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