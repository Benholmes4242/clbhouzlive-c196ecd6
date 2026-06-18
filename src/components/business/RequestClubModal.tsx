import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AppLog } from '@/lib/logger';
import { BIZ } from './businessTokens';

interface RequestClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
}

const INPUT_CLASS =
  'w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors';
const INPUT_STYLE = { background: '#ffffff', border: `1px solid ${BIZ.hair}` };

/**
 * Modal that lets a user request a missing golf course/club be added to the
 * platform. Calls the `request_club_page` RPC.
 */
export function RequestClubModal({ open, onOpenChange, initialName = '' }: RequestClubModalProps) {
  const { user } = useSupabaseSession();
  const [courseName, setCourseName] = useState(initialName);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCourseName(initialName);
      setNote('');
    }
  }, [open, initialName]);

  const canSubmit = courseName.trim().length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('request_club_page', {
        p_club_name: courseName.trim(),
        p_manager_email: user?.email ?? undefined,
      });
      if (error) throw error;
      toast.success("Thanks — we'll review and add it soon.");
      onOpenChange(false);
    } catch (err) {
      AppLog.error('[RequestClubModal]', 'request_club_page failed', err);
      toast.error("Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a course</DialogTitle>
          <DialogDescription>
            Can't find your course? Send us the name and we'll add it to clbhouz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Course name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Royal Lytham & St Annes"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Anything we should know? (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Location, website, or any other detail."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? BIZ.amber : 'rgba(15,23,42,0.06)',
                color: canSubmit ? '#fff' : 'rgba(15,23,42,0.45)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RequestClubModal;
