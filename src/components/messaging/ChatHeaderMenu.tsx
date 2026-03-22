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

 /* Icon box helper */
 function IconBox({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
   return (
     <div
       className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0"
       style={{ background: bg }}
     >
       {children}
     </div>
   );
 }

 /* Hairline divider */
 function Hairline() {
   return <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />;
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
     if (otherUserId) {
       navigate(`/profile/${otherUserId}`);
     }
   };

   const handleToggleMute = async () => {
     haptic('light');
     try {
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

   const menuItemClass = "gap-3 px-[14px] py-[10px] cursor-pointer min-h-[44px] focus:bg-[rgba(0,0,0,0.03)]";
   const destructiveItemClass = "gap-3 px-[14px] py-[10px] cursor-pointer min-h-[44px] focus:bg-[rgba(0,0,0,0.03)] text-destructive focus:text-destructive";

   return (
     <>
       <DropdownMenu>
       <DropdownMenuTrigger asChild>
           <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[hsl(38,92%,50%)]/5 transition-colors focus:outline-none">
             <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-[#F8FAFC] border border-[rgba(0,0,0,0.07)] shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.07)] rounded-[14px] z-50 overflow-hidden p-0"
        >
         {isGroupChat ? (
           <>
             {/* Group Chat Menu */}
             <DropdownMenuItem 
               onClick={onOpenGroupInfo}
               className={menuItemClass}
             >
               <IconBox bg="#EFF6FF" color="#3B82F6">
                 <Info size={17} style={{ color: '#3B82F6' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Group Info</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={onSearchInChat}
               className={menuItemClass}
             >
               <IconBox bg="#F0FDF4" color="#22C55E">
                 <Search size={17} style={{ color: '#22C55E' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Search in Chat</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={handleToggleMute}
               className={menuItemClass}
             >
               {isMuted ? (
                 <>
                   <IconBox bg="rgba(245,166,35,0.10)" color="#F5A623">
                     <Bell size={17} style={{ color: '#F5A623' }} />
                   </IconBox>
                   <span style={{ color: '#0f172a' }}>Unmute Notifications</span>
                 </>
               ) : (
                 <>
                   <IconBox bg="#FFF7ED" color="#F97316">
                     <BellOff size={17} style={{ color: '#F97316' }} />
                   </IconBox>
                   <span style={{ color: '#0f172a' }}>Mute Notifications</span>
                 </>
               )}
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={onViewSharedMedia}
               className={menuItemClass}
             >
               <IconBox bg="#F5F3FF" color="#8B5CF6">
                 <Image size={17} style={{ color: '#8B5CF6' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Shared Media</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={() => setShowLeaveGroupDialog(true)}
               className={destructiveItemClass}
             >
               <IconBox bg="rgba(239,68,68,0.08)" color="#ef4444">
                 <LogOut size={17} style={{ color: '#ef4444' }} />
               </IconBox>
               <span style={{ color: '#ef4444' }}>Leave Group</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={handleReport}
               className={destructiveItemClass}
             >
               <IconBox bg="rgba(239,68,68,0.08)" color="#ef4444">
                 <Flag size={17} style={{ color: '#ef4444' }} />
               </IconBox>
               <span style={{ color: '#ef4444' }}>Report Group</span>
             </DropdownMenuItem>
           </>
         ) : (
           <>
             {/* DM Menu */}
             <DropdownMenuItem 
               onClick={handleViewProfile}
               className={menuItemClass}
             >
               <IconBox bg="#EFF6FF" color="#3B82F6">
                 <User size={17} style={{ color: '#3B82F6' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>View Profile</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={onSearchInChat}
               className={menuItemClass}
             >
               <IconBox bg="#F0FDF4" color="#22C55E">
                 <Search size={17} style={{ color: '#22C55E' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Search in Chat</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={handleToggleMute}
               className={menuItemClass}
             >
               {isMuted ? (
                 <>
                   <IconBox bg="rgba(245,166,35,0.10)" color="#F5A623">
                     <Bell size={17} style={{ color: '#F5A623' }} />
                   </IconBox>
                   <span style={{ color: '#0f172a' }}>Unmute Notifications</span>
                 </>
               ) : (
                 <>
                   <IconBox bg="#FFF7ED" color="#F97316">
                     <BellOff size={17} style={{ color: '#F97316' }} />
                   </IconBox>
                   <span style={{ color: '#0f172a' }}>Mute Notifications</span>
                 </>
               )}
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={onViewSharedMedia}
               className={menuItemClass}
             >
               <IconBox bg="#F5F3FF" color="#8B5CF6">
                 <Image size={17} style={{ color: '#8B5CF6' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Shared Media</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={() => setShowClearChatDialog(true)}
               className={menuItemClass}
             >
               <IconBox bg="rgba(239,68,68,0.08)" color="#ef4444">
                 <Trash2 size={17} style={{ color: '#ef4444' }} />
               </IconBox>
               <span style={{ color: '#0f172a' }}>Clear Chat</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={handleBlockUser}
               className={destructiveItemClass}
             >
               <IconBox bg="rgba(239,68,68,0.08)" color="#ef4444">
                 <Ban size={17} style={{ color: '#ef4444' }} />
               </IconBox>
               <span style={{ color: '#ef4444' }}>Block User</span>
             </DropdownMenuItem>
             
             <Hairline />
             
             <DropdownMenuItem 
               onClick={handleReport}
               className={destructiveItemClass}
             >
               <IconBox bg="rgba(239,68,68,0.08)" color="#ef4444">
                 <Flag size={17} style={{ color: '#ef4444' }} />
               </IconBox>
               <span style={{ color: '#ef4444' }}>Report</span>
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