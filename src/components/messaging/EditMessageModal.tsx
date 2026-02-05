 /**
  * EditMessageModal - Bottom sheet modal for editing a message
  */
 
 import { useState, useEffect } from 'react';
 import { X, Check } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
 } from '@/components/ui/sheet';
 import { haptic } from '@/utils/haptics';
 
 interface EditMessageModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   originalContent: string;
   onSave: (newContent: string) => void;
 }
 
 export function EditMessageModal({
   open,
   onOpenChange,
   originalContent,
   onSave,
 }: EditMessageModalProps) {
   const [content, setContent] = useState(originalContent);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     if (open) {
       setContent(originalContent);
     }
   }, [open, originalContent]);
 
   const handleSave = async () => {
     if (!content.trim() || content === originalContent) return;
     
     haptic('light');
     setSaving(true);
     try {
       await onSave(content.trim());
       onOpenChange(false);
     } finally {
       setSaving(false);
     }
   };
 
   const handleCancel = () => {
     haptic('light');
     onOpenChange(false);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
         <SheetHeader className="pb-4">
           <SheetTitle className="text-center text-[17px] font-semibold">
             Edit Message
           </SheetTitle>
         </SheetHeader>
 
         <div className="space-y-4">
           <Textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             placeholder="Edit your message..."
             className="min-h-[100px] resize-none rounded-2xl border-[#E5E5EA] focus:border-[#2A9D5C] focus:ring-[#2A9D5C]"
             autoFocus
           />
 
           <div className="flex gap-3">
             <Button
               variant="outline"
               onClick={handleCancel}
               className="flex-1 h-12 rounded-full border-[#E5E5EA]"
             >
               <X className="w-4 h-4 mr-2" />
               Cancel
             </Button>
             <Button
               onClick={handleSave}
               disabled={!content.trim() || content === originalContent || saving}
               className="flex-1 h-12 rounded-full bg-[#2A9D5C] hover:bg-[#238B4E]"
             >
               <Check className="w-4 h-4 mr-2" />
               {saving ? 'Saving...' : 'Save'}
             </Button>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
 }