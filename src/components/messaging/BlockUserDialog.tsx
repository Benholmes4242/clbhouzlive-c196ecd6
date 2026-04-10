 /**
   * BlockUserDialog - Confirmation dialog for blocking a user
   */
 
 import { useState } from 'react';
 import { Ban, Loader2 } from 'lucide-react';
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
 import { AppLog } from '@/lib/logger';
 
 interface BlockUserDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   userId: string;
   userName: string;
   onBlocked: () => void;
 }
 
 export function BlockUserDialog({
   open,
   onOpenChange,
   userId,
   userName,
   onBlocked,
 }: BlockUserDialogProps) {
   const [blocking, setBlocking] = useState(false);
 
   const handleBlock = async () => {
     haptic('medium');
     setBlocking(true);
 
     try {
       const { error } = await supabase.rpc('block_user' as any, {
         p_blocked_id: userId,
       });
 
       if (error) throw error;
 
       toast.success('User blocked', {
         description: `${userName} can no longer message you.`,
       });
 
       onBlocked();
       onOpenChange(false);
     } catch (error) {
       AppLog.error('[BlockUserDialog]', 'Error blocking user:', error);
       toast.error("Couldn't block user");
     } finally {
       setBlocking(false);
     }
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent className="rounded-2xl">
         <AlertDialogHeader>
           <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
             <Ban className="w-7 h-7 text-red-500" />
           </div>
           <AlertDialogTitle className="text-center">
             Block {userName}?
           </AlertDialogTitle>
           <AlertDialogDescription className="text-center">
             They won't be able to send you messages or see when you're online. 
             Your conversation will be archived.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter className="flex-col sm:flex-col gap-2">
           <AlertDialogAction
             onClick={handleBlock}
             disabled={blocking}
             className="w-full h-12 rounded-full bg-red-500 hover:bg-red-600"
           >
             {blocking ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Blocking...
               </>
             ) : (
               'Block'
             )}
           </AlertDialogAction>
           <AlertDialogCancel className="w-full h-12 rounded-full mt-0">
             Cancel
           </AlertDialogCancel>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }
