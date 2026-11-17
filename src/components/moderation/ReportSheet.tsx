/**
 * ReportSheet - Report a user, group, review, or message.
 * REPORT_SHEET_CANON: canonical BottomSheet + dark SheetHeader, white
 * controls, no amber/red/emoji. Submit payload is unchanged.
 */

import { useState } from 'react';
import { useGuestSheetGate } from '@/features/guest/useGuestActionGate';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { haptic } from '@/utils/haptics';
import { AppLog } from '@/lib/logger';
import './reportSheet.css';

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedConversationId?: string;
  reportedReviewId?: string;
  reportedMessageId?: string;
  reportType: 'user' | 'group' | 'review' | 'message';
  /** Only for reportType 'user': titles the sheet "Report business". */
  subject?: 'golfer' | 'business';
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', sub: 'Ads, scams or repeated messages' },
  { id: 'harassment', label: 'Harassment', sub: 'Bullying, threats or abuse' },
  { id: 'inappropriate', label: 'Inappropriate content', sub: 'Nudity, hate or violence' },
  { id: 'impersonation', label: 'Impersonation', sub: 'Pretending to be someone else' },
  { id: 'other', label: 'Something else', sub: "Tell us what's wrong" },
];

export function reportSheetTitle(reportType: ReportSheetProps['reportType'], subject: ReportSheetProps['subject'] = 'golfer'): string {
  if (reportType === 'message') return 'Report message';
  if (reportType === 'review') return 'Report review';
  if (reportType === 'group') return 'Report group';
  return subject === 'business' ? 'Report business' : 'Report golfer';
}

export function ReportSheet({
  open: openProp,
  onOpenChange,
  reportedUserId,
  reportedConversationId,
  reportedReviewId,
  reportedMessageId,
  reportType,
  subject = 'golfer',
}: ReportSheetProps) {
  // GUEST §5: a guest never reaches the report form; the action card opens.
  const open = useGuestSheetGate(openProp, () => onOpenChange(false), 'report');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    haptic('light');
    setSubmitting(true);

    let finalDetails = details.trim() || null;
    if (reportedReviewId) {
      finalDetails = `[REVIEW:${reportedReviewId}] ${finalDetails || ''}`.trim();
    } else if (reportedMessageId) {
      finalDetails = `[MSG:${reportedMessageId}] ${finalDetails || ''}`.trim();
    }

    try {
      const { error } = await supabase.rpc('submit_report', {
        p_reported_user_id: reportedUserId || null,
        p_reported_conversation_id: reportedConversationId || null,
        p_reason: selectedReason,
        p_details: finalDetails,
      });

      if (error) throw error;

      toast.success('Report sent', { description: "Thanks. We'll take a look." });

      onOpenChange(false);
      setSelectedReason(null);
      setDetails('');
    } catch (error) {
      AppLog.error('[ReportSheet]', 'Error submitting report:', error);
      toast.error("Couldn't send your report");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = !selectedReason || (selectedReason === 'other' && !details.trim()) || submitting;

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} ariaLabelledBy="report-sheet-title">
      <div className="report-sheet">
        <SheetHeader dark borderBottom={false} title={<span id="report-sheet-title">{reportSheetTitle(reportType, subject)}</span>}
          sub="The clbhouz team reviews every report." onClose={() => onOpenChange(false)} />
        <div className="report-reasons" role="radiogroup">
          {REPORT_REASONS.map((reason) => {
            const on = selectedReason === reason.id;
            return (
              <button key={reason.id} type="button" role="radio" aria-checked={on}
                className={on ? 'report-reason on' : 'report-reason'}
                onClick={() => { haptic('light'); setSelectedReason(reason.id); }}>
                <span className="report-reason-text">
                  <span className="report-reason-title">{reason.label}</span>
                  <span className="report-reason-sub">{reason.sub}</span>
                </span>
                <span className="report-radio" aria-hidden />
              </button>
            );
          })}
        </div>
        {selectedReason && (
          <div className="report-details">
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} aria-label="Report details"
              placeholder={selectedReason === 'other' ? "Tell us what's wrong" : 'Anything else we should know? (optional)'} />
          </div>
        )}
        <button type="button" className="report-send" disabled={disabled} onClick={handleSubmit}>
          {submitting ? 'Sending...' : 'Send report'}
        </button>
      </div>
    </BottomSheet>
  );
}
