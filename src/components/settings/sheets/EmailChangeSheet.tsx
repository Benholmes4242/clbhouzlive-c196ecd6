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

  const handleSubmit = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter a new email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail !== confirmEmail) {
      toast.error('Email addresses do not match');
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('secure-email-change', {
        body: { newEmail, currentEmail },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Confirmation sent', {
        description: 'Check your inbox to finish updating your email.'
      });

      setNewEmail('');
      setConfirmEmail('');
      onOpenChange(false);

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }, 3000);

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
    if (!isOpen) {
      setNewEmail('');
      setConfirmEmail('');
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
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@newemail.com"
              className="h-12 rounded-lg bg-muted border-border focus:border-amber-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-sm font-medium text-foreground">
              Confirm new email
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm your new email"
              className="h-12 rounded-lg bg-muted border-border focus:border-amber-500"
              disabled={isSubmitting}
            />
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
