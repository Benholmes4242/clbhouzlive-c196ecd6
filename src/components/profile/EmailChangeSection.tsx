
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmailChangeSectionProps { currentEmail?: string; }

const EmailChangeSection: React.FC<EmailChangeSectionProps> = ({ currentEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canChangeEmail = () => newEmail && confirmEmail && newEmail === confirmEmail && isValidEmail(newEmail) && newEmail !== currentEmail;

  const handleEmailChange = async () => {
    if (!canChangeEmail()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-email-change', {
        body: { newEmail, currentEmail }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Email Updated Successfully", {
        description: `Your email address has been changed. You'll be signed out in a few seconds to re-authenticate with your new email.`,
      });
      setNewEmail('');
      setConfirmEmail('');
      setTimeout(() => { supabase.auth.signOut(); }, 3000);
    } catch (error: any) {
      let errorMessage = error.message || "Failed to change email";
      if (error.message?.includes('cooldown')) errorMessage = "Email change is in cooldown period. Please wait before changing your email again.";
      else if (error.message?.includes('already in use')) errorMessage = "This email address is already in use by another account.";
      toast.error("Error", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Change Email Address</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label htmlFor="current-email">Current Email</Label><Input id="current-email" type="email" value={currentEmail || ''} disabled className="bg-gray-100" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label htmlFor="new-email">New Email</Label><Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email address" disabled={loading} /></div>
          <div><Label htmlFor="confirm-email">Confirm New Email</Label><Input id="confirm-email" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="Confirm new email address" disabled={loading} /></div>
        </div>
        {newEmail && confirmEmail && newEmail !== confirmEmail && <p className="text-sm text-destructive">Email addresses do not match</p>}
        {newEmail && !isValidEmail(newEmail) && <p className="text-sm text-destructive">Please enter a valid email address</p>}
        {newEmail && newEmail === currentEmail && <p className="text-sm text-muted-foreground">This is your current email address</p>}
        <AlertDialog>
          <AlertDialogTrigger asChild><Button disabled={!canChangeEmail() || loading} className="w-full md:w-auto">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Change Email</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Email Address</AlertDialogTitle>
              <AlertDialogDescription>You are about to change your email from <strong>{currentEmail}</strong> to <strong>{newEmail}</strong>.<br /><br />Your email will be updated immediately and you will need to sign in again with your new email address.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleEmailChange}>Change Email Now</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default EmailChangeSection;
