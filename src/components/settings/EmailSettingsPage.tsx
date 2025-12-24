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
      const { data, error } = await supabase.functions.invoke('secure-email-change', {
        body: { newEmail, currentEmail: user?.email }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Confirmation sent', {
        description: 'Check your inbox to finish updating your email.'
      });

      setNewEmail('');
      setConfirmEmail('');
      setShowConfirm(false);

      // Sign out after short delay
      setTimeout(() => supabase.auth.signOut(), 3000);
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
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
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
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[rgba(31,36,40,0.06)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1F2428]" />
        </button>
        <h1 className="text-lg font-semibold text-[#1F2428]">Change email</h1>
      </header>

      <div className="max-w-md mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          {/* Info */}
          <div 
            className="flex items-start gap-3 p-4 rounded-[14px] border border-[rgba(31,36,40,0.06)] bg-[#FAFAFB]"
          >
            <Mail className="w-4 h-4 text-[#97A1AA] mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-[#5E666D] leading-relaxed">
              You'll need to confirm the new email address.
            </p>
          </div>

          {/* Current email */}
          <div className="space-y-2">
            <Label className="text-[#5E666D]">Current email</Label>
            <div className="px-4 py-3 rounded-[12px] bg-[#EDEFF2] border border-[rgba(31,36,40,0.06)] text-[#97A1AA] text-[15px]">
              {maskEmail(user?.email)}
            </div>
          </div>

          {/* New email */}
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-[#1F2428]">
              New email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] placeholder:text-[#97A1AA]"
              disabled={isUpdating}
            />
          </div>

          {/* Confirm email */}
          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-[#1F2428]">
              Confirm new email
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm new email"
              className="bg-white border-[rgba(31,36,40,0.1)] text-[#1F2428] placeholder:text-[#97A1AA]"
              disabled={isUpdating}
            />
          </div>

          {/* Validation messages */}
          {newEmail && !isValidEmail(newEmail) && (
            <p className="text-[13px] text-red-600">Please enter a valid email address</p>
          )}
          {newEmail && confirmEmail && newEmail !== confirmEmail && (
            <p className="text-[13px] text-red-600">Email addresses don't match</p>
          )}
          {newEmail === user?.email && (
            <p className="text-[13px] text-[#97A1AA]">This is your current email address</p>
          )}

          {/* Submit */}
          <Button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!isValid || isUpdating}
            className="w-full bg-[#1F2428] text-white hover:bg-[#2A3038] disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send confirmation email
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-white border-[rgba(31,36,40,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1F2428]">Change email address</AlertDialogTitle>
            <AlertDialogDescription className="text-[#5E666D]">
              Your email will be updated to <strong className="text-[#1F2428]">{newEmail}</strong>.
              You'll need to sign in again with your new email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#EDEFF2] border-transparent text-[#1F2428] hover:bg-[#E4E6E9]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              disabled={isUpdating}
              className="bg-[#1F2428] text-white hover:bg-[#2A3038]"
            >
              {isUpdating ? 'Sending...' : 'Change email now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageRoot>
  );
}

export default EmailSettingsPage;
