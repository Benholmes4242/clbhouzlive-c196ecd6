import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EmailChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function EmailChangeSheet({ open, onOpenChange, currentEmail }: EmailChangeSheetProps) {
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ newEmail?: string; confirmEmail?: string }>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const clearError = (field: 'newEmail' | 'confirmEmail') => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: { newEmail?: string; confirmEmail?: string } = {};

    if (!newEmail.trim()) {
      newErrors.newEmail = 'Please enter a new email address';
    } else if (!emailRegex.test(newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    } else if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      newErrors.newEmail = 'This is already your current email';
    }

    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = 'Please confirm your new email';
    } else if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Emails don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Server-side validation (cooldown, same-email check, format)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('secure-email-change', {
        body: { newEmail },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.error) {
        // Map server errors to inline field errors where possible
        if (data.error.includes('different from your current email')) {
          setErrors({ newEmail: 'This is already your current email' });
        } else if (data.error.includes('cooldown')) {
          toast.error(data.error);
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Step 2: Trigger Supabase's built-in confirmation email flow
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });

      if (updateError) {
        // Handle specific Supabase errors
        const msg = updateError.message?.toLowerCase() || '';
        if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('unique')) {
          setErrors({ newEmail: 'This email is already associated with another account' });
        } else {
          toast.error('Could not send confirmation email', {
            description: updateError.message || 'Please try again in a moment.'
          });
        }
        return;
      }

      // Success — confirmation email sent, email NOT changed yet
      toast.success('Confirmation link sent', {
        description: `We've sent a confirmation link to ${newEmail}. Your email will update once you confirm.`
      });

      setNewEmail('');
      setConfirmEmail('');
      setErrors({});
      onOpenChange(false);

    } catch (err: any) {
      console.error('[EmailChange] error:', err);
      toast.error("Couldn't update email", {
        description: 'Please try again in a moment.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    // Block dismiss during submission so the user sees the result
    if (!isOpen && isSubmitting) return;
    if (!isOpen) {
      setNewEmail('');
      setConfirmEmail('');
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  const isDisabled = isSubmitting || !newEmail || !confirmEmail;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[20px] px-4 bg-background max-w-full"
        style={{ maxHeight: '85vh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-foreground text-lg font-semibold">
            Change email
          </SheetTitle>
          <p className="text-center text-[13px] text-muted-foreground">
            You'll need to confirm the new email address.
          </p>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-sm font-medium text-foreground">
              New email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); clearError('newEmail'); }}
              placeholder="your@newemail.com"
              className={`h-12 rounded-lg bg-muted ${errors.newEmail ? 'border-destructive focus:border-destructive' : 'border-border focus:border-amber-500'}`}
              disabled={isSubmitting}
            />
            {errors.newEmail && (
              <p className="text-xs text-destructive mt-1">{errors.newEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-sm font-medium text-foreground">
              Confirm new email
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => { setConfirmEmail(e.target.value); clearError('confirmEmail'); }}
              placeholder="Confirm your new email"
              className={`h-12 rounded-lg bg-muted ${errors.confirmEmail ? 'border-destructive focus:border-destructive' : 'border-border focus:border-amber-500'}`}
              disabled={isSubmitting}
            />
            {errors.confirmEmail && (
              <p className="text-xs text-destructive mt-1">{errors.confirmEmail}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full h-12 mt-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send confirmation email'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}