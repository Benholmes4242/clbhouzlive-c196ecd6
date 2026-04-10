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
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0', margin: '12px auto' }} />
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
            className="min-h-[100px] resize-none rounded-2xl border-border focus:border-[#F7931E]/40 focus:ring-[#F7931E]/20"
            autoFocus
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-12 rounded-full border-border/40"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim() || content === originalContent || saving}
              className="flex-1 h-12 rounded-full text-white border-0 active:scale-[0.97] transition-transform"
              style={{ background: '#F7931E' }}
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
