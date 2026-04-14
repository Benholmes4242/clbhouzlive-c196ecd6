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
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)', margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px 14px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Edit Message
          </span>
        </div>

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
              className="flex-1 h-12 rounded-full"
              style={{ border: '0.5px solid rgba(15,23,42,0.12)', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#64748B' }}
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
