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
} from '@/components/ui/sheet';
import { haptic } from '@/utils/haptics';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { AMBER, INK_MUTE } from './_shared/tokens';

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px 14px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <SectionEyebrow label="Edit Message" />
        </div>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Edit your message..."
            className=`min-h-[100px] resize-none rounded-2xl border-border focus:border-[${AMBER}]/40 focus:ring-[${AMBER}]/20`
            autoFocus
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-12 rounded-full"
              style={{ border: '0.5px solid rgba(15,23,42,0.12)', background: 'transparent', fontSize: 14, fontWeight: 600, color: INK_MUTE }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim() || content === originalContent || saving}
              className="flex-1 h-12 rounded-full text-white border-0 active:scale-[0.97] transition-transform"
              style={{ background: AMBER }}
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
