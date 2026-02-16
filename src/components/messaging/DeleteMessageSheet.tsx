 /**
  * DeleteMessageSheet - Options sheet for deleting a message
  */
 
 import { Trash2, User, Users } from 'lucide-react';
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
 } from '@/components/ui/sheet';
 import { haptic } from '@/utils/haptics';
 
 interface DeleteMessageSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   isOwnMessage: boolean;
   canDeleteForEveryone: boolean; // true if message is within 1 hour
   onDeleteForMe: () => void;
   onDeleteForEveryone: () => void;
 }
 
 export function DeleteMessageSheet({
   open,
   onOpenChange,
   isOwnMessage,
   canDeleteForEveryone,
   onDeleteForMe,
   onDeleteForEveryone,
 }: DeleteMessageSheetProps) {
   const handleDeleteForMe = () => {
     haptic('medium');
     onDeleteForMe();
     onOpenChange(false);
   };
 
   const handleDeleteForEveryone = () => {
     haptic('medium');
     onDeleteForEveryone();
     onOpenChange(false);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
         <SheetHeader className="pb-4">
           <SheetTitle className="text-center text-[17px] font-semibold">
             Delete Message
           </SheetTitle>
         </SheetHeader>
 
         <div className="space-y-2">
           {/* Delete for me */}
           <button
             onClick={handleDeleteForMe}
             className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[#F5F5F5] active:bg-[#E5E5EA] transition-colors text-left"
           >
             <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
               <User className="w-5 h-5 text-[#8E8E93]" />
             </div>
             <div>
               <p className="font-medium text-[#1D1D1F]">Delete for me</p>
               <p className="text-sm text-[#8E8E93]">
                 This message will be deleted from your view only
               </p>
             </div>
           </button>
 
           {/* Delete for everyone (only show if own message and within time limit) */}
           {isOwnMessage && (
             <button
               onClick={handleDeleteForEveryone}
               disabled={!canDeleteForEveryone}
               className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-colors text-left ${
                 canDeleteForEveryone 
                   ? 'hover:bg-red-50 active:bg-red-100' 
                   : 'opacity-50 cursor-not-allowed'
               }`}
             >
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                 canDeleteForEveryone ? 'bg-red-100' : 'bg-[#F5F5F5]'
               }`}>
                 <Users className={`w-5 h-5 ${canDeleteForEveryone ? 'text-red-500' : 'text-[#8E8E93]'}`} />
               </div>
               <div>
                 <p className={`font-medium ${canDeleteForEveryone ? 'text-red-500' : 'text-[#8E8E93]'}`}>
                   Delete for everyone
                 </p>
                 <p className="text-sm text-[#8E8E93]">
                   {canDeleteForEveryone 
                     ? 'This message will be deleted for all participants' 
                     : 'Only available within 1 hour of sending'
                   }
                 </p>
               </div>
             </button>
           )}
 
           {/* Cancel button */}
           <button
             onClick={() => onOpenChange(false)}
             className="w-full py-4 text-center text-amber-600 font-semibold rounded-2xl hover:bg-amber-50 active:bg-amber-100/50 transition-colors mt-2"
           >
             Cancel
           </button>
         </div>
       </SheetContent>
     </Sheet>
   );
 }