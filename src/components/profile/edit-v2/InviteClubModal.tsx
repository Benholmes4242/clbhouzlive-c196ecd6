import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  clubName: string;
  userId: string;
}

/**
 * Modal for inviting a club that doesn't have a business profile yet.
 */
export const InviteClubModal: React.FC<InviteClubModalProps> = ({
  open,
  onOpenChange,
  clubId,
  clubName,
  userId,
}) => {
  const [managerEmail, setManagerEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail);

  const handleSubmit = async () => {
    if (!isValidEmail) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('club_page_requests')
        .insert({
          requested_club_id: clubId,
          requested_club_name: clubName,
          requested_club_key: clubName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          requester_user_profile_id: userId,
          manager_email: managerEmail.trim(),
          note: note.trim() || null,
        } as any);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Invite sent');
      
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setManagerEmail('');
        setNote('');
      }, 1500);
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground" />
            Invite your club
          </DialogTitle>
          <DialogDescription>
            Help <span className="font-medium text-foreground">{clubName}</span> get set up on Clbhouz.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Invite sent!</p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll let you know if they join.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="managerEmail" className="text-sm">
                Club manager's email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="managerEmail"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@golfclub.com"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                We'll send them an invitation to claim their club profile.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm">
                Add a note (optional)
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., I'm a member and would love to see the club on Clbhouz!"
                className="min-h-[80px] resize-none rounded-sq-sm"
                maxLength={300}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isValidEmail}
                className="flex-1"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send invite'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};