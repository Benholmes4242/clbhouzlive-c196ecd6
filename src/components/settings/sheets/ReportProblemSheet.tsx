import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportProblemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

/**
 * Collects device/browser context for debugging
 */
function collectContext(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    url: window.location.href,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,
  };
}

export function ReportProblemSheet({ open, onOpenChange, userId }: ReportProblemSheetProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please describe the problem');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Please provide more detail');
      return;
    }

    setIsSubmitting(true);

    try {
      const context = collectContext();

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          type: 'bug_report',
          description: description.trim(),
          context: context as any, // Type will sync after migration
        });

      if (error) throw error;

      toast.success('Report submitted', {
        description: "We'll look into this as soon as possible.",
      });
      setDescription('');
      onOpenChange(false);
    } catch (err) {
      console.error('[ReportProblem] submit error:', err);
      toast.error("Couldn't send report", {
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} ariaLabelledBy="report-problem-title">
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E6E9]">
          <div className="w-8" />
          <div className="flex-1 flex justify-center">
            <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#5E666D]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h2 id="report-problem-title" className="text-lg font-semibold text-[#1F2428] mb-2">
            Report a problem
          </h2>
          <p className="text-[13px] text-[#5E666D] mb-4">
            Tell us what's not working and we'll investigate. Device info will be included automatically.
          </p>

          <div className="space-y-2">
            <label htmlFor="problem-description" className="text-[13px] font-medium text-[#1F2428]">
              What happened?
            </label>
            <Textarea
              id="problem-description"
              placeholder="Describe the issue you're experiencing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] resize-none border-[#E4E6E9] focus:border-[#1F2428] focus:ring-0 text-[14px]"
              maxLength={1000}
            />
            <p className="text-[11px] text-[#97A1AA] text-right">
              {description.length}/1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#E4E6E9]">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="w-full h-12 bg-[#1F2428] text-white hover:bg-[#2A3038] font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send report'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
