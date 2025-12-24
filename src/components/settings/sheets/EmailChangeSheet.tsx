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
    // Validation
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

      // Clear form and close
      setNewEmail('');
      setConfirmEmail('');
      onOpenChange(false);

      // Sign out after delay (existing behavior)
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[18px] px-4 pb-8 bg-white max-w-full"
        style={{ maxHeight: '85vh' }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full bg-[#E4E6E9]" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-[#1F2428] text-lg font-semibold">
            Change email
          </SheetTitle>
          <p className="text-center text-[13px] text-[#5E666D]">
            You'll need to confirm the new email address.
          </p>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-[#5E666D] text-sm">
              New email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@newemail.com"
              className="h-12 bg-[#F8FAFC] border-[rgba(31,36,40,0.1)] focus:border-[#3A3F46]"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-[#5E666D] text-sm">
              Confirm new email
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm your new email"
              className="h-12 bg-[#F8FAFC] border-[rgba(31,36,40,0.1)] focus:border-[#3A3F46]"
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newEmail || !confirmEmail}
            className="w-full h-12 mt-4 bg-[#1F2428] text-white hover:bg-[#2A3038] rounded-xl font-medium"
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
