import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * EmailSettingsPage - Change email detail screen (Light theme)
 */
export function EmailSettingsPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [newEmail, setNewEmail] = React.useState('');
  const [confirmEmail, setConfirmEmail] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = newEmail && confirmEmail && newEmail === confirmEmail && isValidEmail(newEmail) && newEmail !== user?.email;

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      // Step 1: Server-side validation (cooldown, same-email, format)
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
      if (data?.error) throw new Error(data.error);

      // Step 2: Trigger Supabase's built-in confirmation email flow
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
      if (updateError) throw updateError;

      toast.success('Confirmation link sent', {
        description: `We've sent a confirmation link to ${newEmail}. Your email will update once you confirm.`
      });

      setNewEmail('');
      setConfirmEmail('');
      setShowConfirm(false);

    } catch (err: any) {
      console.error('[EmailSettings] error:', err);
      toast.error("Couldn't update email", {
        description: err.message || 'Please try again in a moment.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to mask email
  const maskEmail = (email?: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.charAt(0) + '••••••••';
    return `${masked}@${domain}`;
  };

  return (
    <PageRoot className="min-h-screen bg-background">
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(248,250,252,0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(31,36,40,0.06)',
          boxShadow: '0 6px 18px rgba(31,36,40,0.06)',
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Change email</h1>
      </header>

      <div className="max-w-md mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          {/* Info */}
          <div className="flex items-start gap-3 p-4 rounded-[14px] border border-border bg-muted">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              You'll need to confirm the new email address.
            </p>
          </div>

          {/* Current email */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Current email</Label>
            <div className="px-4 py-3 rounded-lg bg-muted border border-border text-muted-foreground text-[15px]">
              {maskEmail(user?.email)}
            </div>
          </div>

          {/* New email */}
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-foreground">
              New email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500"
              disabled={isUpdating}
            />
          </div>

          {/* Confirm email */}
          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-foreground">
              Confirm new email
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm new email"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500"
              disabled={isUpdating}
            />
          </div>

          {/* Validation messages */}
          {newEmail && !isValidEmail(newEmail) && (
            <p className="text-[13px] text-destructive">Please enter a valid email address</p>
          )}
          {newEmail && confirmEmail && newEmail !== confirmEmail && (
            <p className="text-[13px] text-destructive">Email addresses don't match</p>
          )}
          {newEmail === user?.email && (
            <p className="text-[13px] text-muted-foreground">This is your current email address</p>
          )}

          {/* Submit */}
          <Button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!isValid || isUpdating}
            className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          >
            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send confirmation email
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Change email address</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              A confirmation link will be sent to <strong className="text-foreground">{newEmail}</strong>.
              Your email will update once you confirm via the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-transparent text-foreground hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              disabled={isUpdating}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdating ? 'Sending...' : 'Send confirmation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageRoot>
  );
}

export default EmailSettingsPage;