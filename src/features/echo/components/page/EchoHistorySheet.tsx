 /**
  * EchoHistorySheet - WhatsApp-style bottom sheet for viewing past Echo conversations
  * Features: swipe-to-delete, delete confirmation, drag-to-dismiss, skeleton loading
  */
 
 import React, { useEffect, useState } from 'react';
 import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
 import { Clock, ChevronRight, Trash2 } from 'lucide-react';
 import { useMutation, useQueryClient } from '@tanstack/react-query';
 import { useEchoConversations } from '../../hooks/useEchoHistory';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
 
 interface EchoHistorySheetProps {
   isOpen: boolean;
   onClose: () => void;
   onSelectConversation: (conversationId: string) => void;
 }
 
 interface EchoConversation {
   id: string;
   title: string | null;
   last_message_at: string;
   created_at: string;
 }
 
 function formatRelativeDate(dateString: string): string {
   if (!dateString) return '';
   
   const date = new Date(dateString);
   const now = new Date();
   const diffMs = now.getTime() - date.getTime();
   const diffMins = Math.floor(diffMs / (1000 * 60));
   const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
   
   if (diffMins < 1) return 'Just now';
   if (diffMins < 60) return `${diffMins}m ago`;
   if (diffHours < 24) return `${diffHours}h ago`;
   if (diffDays === 0) return 'Today';
   if (diffDays === 1) return 'Yesterday';
   if (diffDays < 7) return `${diffDays} days ago`;
   
   return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
 }
 
 // Haptic feedback helper
 function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
   if ('vibrate' in navigator) {
     const patterns = { light: 10, medium: 20, heavy: 30 };
     navigator.vibrate(patterns[style]);
   }
 }
 
 // Delete mutation hook
 function useDeleteEchoConversation() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (conversationId: string) => {
       await supabase
         .from('echo_conversation_messages')
         .delete()
         .eq('conversation_id', conversationId);
       
       const { error } = await supabase
         .from('echo_conversations')
         .delete()
         .eq('id', conversationId);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
     },
   });
 }
 
 // Skeleton loading component
 function HistorySkeleton() {
   return (
     <div className="space-y-1 px-4">
       {[...Array(5)].map((_, i) => (
         <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-[18px]">
           <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
           <div className="flex-1 space-y-2">
             <div className="h-4 bg-gray-200 animate-pulse rounded-full w-3/4" />
             <div className="h-3 bg-gray-100 animate-pulse rounded-full w-1/2" />
           </div>
           <div className="h-3 bg-gray-100 animate-pulse rounded-full w-12" />
         </div>
       ))}
     </div>
   );
 }
 
 // Swipeable conversation row
 function SwipeableConversationRow({ 
   conv, 
   onSelect, 
   onDelete,
   showDivider 
 }: { 
   conv: EchoConversation; 
   onSelect: () => void; 
   onDelete: () => void;
   showDivider: boolean;
 }) {
   const x = useMotionValue(0);
   
   const handleDragEnd = () => {
     const currentX = x.get();
     if (currentX < -60) {
       animate(x, -80);
     } else {
       animate(x, 0);
     }
   };
 
   const handleDelete = (e: React.MouseEvent) => {
     e.stopPropagation();
     onDelete();
     animate(x, 0);
   };
 
   const handleSelect = () => {
     if (Math.abs(x.get()) < 5) {
       onSelect();
     } else {
       animate(x, 0);
     }
   };
 
   const displayTitle = conv.title || 'New conversation';
 
   return (
     <div className="relative overflow-hidden">
       <div className="absolute right-0 top-0 bottom-0 w-20 bg-[#FF3B30] flex items-center justify-center" role="none">
         <button 
           onClick={handleDelete} 
           className="w-full h-full flex items-center justify-center"
           aria-label="Delete conversation"
         >
           <Trash2 className="w-5 h-5 text-white" />
         </button>
       </div>
       
       <motion.div
         drag="x"
         dragConstraints={{ left: -80, right: 0 }}
         dragElastic={{ left: 0.1, right: 0 }}
         onDragEnd={handleDragEnd}
         style={{ x }}
         onClick={handleSelect}
         className="relative bg-white px-4 py-3 flex items-center gap-3 active:bg-[#F5F5F5] transition-colors cursor-pointer"
         role="listitem"
         aria-label={`Open conversation: ${displayTitle}`}
       >
         <div className="w-12 h-12 rounded-full bg-[#FFF4E6] flex items-center justify-center flex-shrink-0">
           <div className="w-8 h-8 rounded-full bg-[#FFBF66] flex items-center justify-center">
             <div className="flex items-center gap-[2px]">
               <div className="w-[2px] h-1.5 bg-white rounded-full" />
               <div className="w-[2px] h-2.5 bg-white rounded-full" />
               <div className="w-[2px] h-1.5 bg-white rounded-full" />
             </div>
           </div>
         </div>
         
         <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between mb-0.5">
             <span className="text-[1rem] font-semibold text-[#1D1D1F] truncate">
               {displayTitle}
             </span>
             <span className="text-[0.8125rem] text-[#8E8E93] flex-shrink-0 ml-2">
               {formatRelativeDate(conv.last_message_at || conv.created_at)}
             </span>
           </div>
           <p className="text-[0.875rem] text-[#8E8E93] truncate">
             Tap to continue conversation
           </p>
         </div>
         
         <ChevronRight className="w-5 h-5 text-[#C7C7CC] flex-shrink-0" />
       </motion.div>
       
       {showDivider && <div className="h-px bg-[#E5E5EA] ml-[76px]" />}
     </div>
   );
 }
 
 export function EchoHistorySheet({ isOpen, onClose, onSelectConversation }: EchoHistorySheetProps) {
   const { data: conversations, isLoading, refetch } = useEchoConversations();
   const deleteConversation = useDeleteEchoConversation();
   const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
   const prefersReduced = usePrefersReducedMotion();
   const sheetY = useMotionValue(0);
 
   useEffect(() => {
     if (isOpen) {
       refetch();
     }
   }, [isOpen, refetch]);
 
   const handleDeleteRequest = (conversationId: string) => {
     setConfirmDelete(conversationId);
   };
 
   const handleConfirmDelete = async () => {
     if (!confirmDelete) return;
     try {
       await deleteConversation.mutateAsync(confirmDelete);
       haptic('medium');
       toast.success('Conversation deleted');
     } catch (error) {
       console.error('Failed to delete:', error);
       toast.error('Failed to delete conversation');
     } finally {
       setConfirmDelete(null);
     }
   };
 
   const handleSheetDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
     if (info.offset.y > 100 || info.velocity.y > 500) {
       onClose();
     }
     animate(sheetY, 0, { type: 'spring', damping: 25, stiffness: 300 });
   };
 
   const animationProps = prefersReduced 
     ? { initial: false, exit: undefined, transition: { duration: 0 } }
     : { initial: { opacity: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };
 
   const sheetAnimProps = prefersReduced
     ? { initial: false as const, exit: undefined, transition: { duration: 0 } }
     : { initial: { y: '100%' }, exit: { y: '100%' }, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } };
 
   return (
     <AnimatePresence>
       {isOpen && (
         <>
           <motion.div
             className="fixed inset-0 bg-black/25 z-40"
             initial={animationProps.initial}
             animate={{ opacity: 1 }}
             exit={animationProps.exit}
             onClick={onClose}
           />
           
           <motion.div
             drag="y"
             dragConstraints={{ top: 0, bottom: 0 }}
             dragElastic={{ top: 0, bottom: 0.5 }}
             onDragEnd={handleSheetDragEnd}
             style={{ y: sheetY }}
             className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8FAFC] rounded-t-[20px] h-[75vh] flex flex-col"
             initial={sheetAnimProps.initial}
             animate={{ y: 0 }}
             exit={sheetAnimProps.exit}
             transition={sheetAnimProps.transition}
             role="dialog"
             aria-label="Conversation history"
           >
             <div 
               className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
               aria-label="Drag to close"
             >
               <div className="w-9 h-1 bg-[#C7C7CC] rounded-full" />
             </div>
             
             <div className="px-5 pb-3">
               <h2 className="text-[1.375rem] font-bold text-[#1D1D1F]">History</h2>
             </div>
             
             <div 
               className="flex-1 min-h-0 overflow-y-auto" 
               role="list"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
             >
               {isLoading ? (
                 <HistorySkeleton />
               ) : !conversations || conversations.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16">
                   <div className="w-16 h-16 rounded-full bg-[#E5E5EA] flex items-center justify-center mb-4">
                     <Clock className="w-7 h-7 text-[#8E8E93]" />
                   </div>
                   <h3 className="text-[1.0625rem] font-semibold text-[#1D1D1F] mb-1">No history yet</h3>
                   <p className="text-[0.875rem] text-[#8E8E93] text-center px-8">
                     Your past conversations will appear here
                   </p>
                 </div>
               ) : (
                 <div className="bg-white mx-4 rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                   {conversations.map((conv, index) => (
                     <SwipeableConversationRow
                       key={conv.id}
                       conv={conv}
                       onSelect={() => onSelectConversation(conv.id)}
                       onDelete={() => handleDeleteRequest(conv.id)}
                       showDivider={index < conversations.length - 1}
                     />
                   ))}
                 </div>
               )}
             </div>
           </motion.div>
 
           <AnimatePresence>
             {confirmDelete && (
               <>
                 <motion.div
                   className="fixed inset-0 z-[60] bg-black/30"
                   initial={animationProps.initial}
                   animate={{ opacity: 1 }}
                   exit={animationProps.exit}
                   onClick={() => setConfirmDelete(null)}
                 />
                 <motion.div 
                   className="fixed inset-0 z-[70] flex items-center justify-center px-6"
                   initial={animationProps.initial}
                   animate={{ opacity: 1 }}
                   exit={animationProps.exit}
                 >
                   <motion.div 
                     className="bg-white rounded-2xl p-6 max-w-[300px] w-full shadow-xl"
                     initial={prefersReduced ? false : { scale: 0.9 }}
                     animate={{ scale: 1 }}
                     exit={prefersReduced ? undefined : { scale: 0.9 }}
                     role="alertdialog"
                     aria-label="Confirm delete"
                   >
                     <h3 className="text-[1.0625rem] font-semibold text-[#1D1D1F] mb-2">
                       Delete conversation?
                     </h3>
                     <p className="text-[0.875rem] text-[#8E8E93] mb-6">
                       This can't be undone.
                     </p>
                     <div className="flex gap-3">
                       <button 
                         onClick={() => setConfirmDelete(null)}
                         className="flex-1 py-3 bg-[#F0F0F5] rounded-xl text-[0.9375rem] font-semibold text-[#1D1D1F] active:scale-95 transition-transform"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={handleConfirmDelete}
                         disabled={deleteConversation.isPending}
                         className="flex-1 py-3 bg-[#FF3B30] rounded-xl text-[0.9375rem] font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
                       >
                         {deleteConversation.isPending ? 'Deleting...' : 'Delete'}
                       </button>
                     </div>
                   </motion.div>
                 </motion.div>
               </>
             )}
           </AnimatePresence>
         </>
       )}
     </AnimatePresence>
   );
 }
