/**
 * ReportSheet - Report a user or group
 */

import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import { AppLog } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedConversationId?: string;
  reportType: 'user' | 'group';
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', icon: '📧' },
  { id: 'harassment', label: 'Harassment', icon: '😤' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: '🚫' },
  { id: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { id: 'other', label: 'Other', icon: '❓' },
];

export function ReportSheet({
  open,
  onOpenChange,
  reportedUserId,
  reportedConversationId,
  reportType,
}: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    haptic('light');
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('submit_report', {
        p_reported_user_id: reportedUserId || null,
        p_reported_conversation_id: reportedConversationId || null,
        p_reason: selectedReason,
        p_details: details.trim() || null,
      });

      if (error) throw error;

      toast.success('Report submitted', {
        description: "We'll review this shortly. Thank you for helping keep the community safe.",
      });

      onOpenChange(false);
      setSelectedReason(null);
      setDetails('');
    } catch (error) {
      AppLog.error('[ReportSheet]', 'Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-center gap-2 text-[17px] font-semibold">
            <Flag className="w-5 h-5 text-red-500" />
            Report {reportType === 'group' ? 'Group' : 'User'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <p className="text-sm text-[#8E8E93] text-center">
            Why are you reporting this {reportType}?
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.id}
              onClick={() => {
                  haptic('light');
                  setSelectedReason(reason.id);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left active:scale-[0.97]",
                  selectedReason === reason.id
                    ? "border-border/20 hover:border-border/40"
                    : "border-border/20 hover:border-border/40"
                )}
                style={selectedReason === reason.id ? { borderColor: '#F7931E', background: 'rgba(247,147,30,0.05)' } : undefined}
              >
                <span className="text-xl">{reason.icon}</span>
                <span className="font-medium" style={{ color: '#1D1D1F' }}>{reason.label}</span>
                {selectedReason === reason.id && (
                   <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F7931E' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Details textarea (show for "other" or always) */}
          {selectedReason && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8E8E93]">
                Additional details {selectedReason !== 'other' && '(optional)'}
              </label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide more context about this report..."
                className="min-h-[80px] resize-none rounded-2xl border-amber-200/30"
              />
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other' && !details.trim()) || submitting}
            className="w-full h-12 rounded-full bg-destructive hover:bg-destructive/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 text-center text-muted-foreground font-medium"
          >
            Cancel
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
