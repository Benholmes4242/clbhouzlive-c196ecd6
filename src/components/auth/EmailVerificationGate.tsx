import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailVerificationGateProps {
  email: string;
}

const RESEND_COOLDOWN_SECONDS = 45;

/**
 * EmailVerificationGate - Blocks app access until email is verified
 * Shows a clean verification screen with options to resend email or sign out
 */
export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({ email }) => {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Couldn't resend email");
        console.error('Resend error:', error);
      } else {
        toast.success('Verification email sent');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      toast.error('Something went wrong');
      console.error('Resend error:', err);
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Verify your email
          </h1>
          <p className="text-muted-foreground">
            We sent a verification link to
          </p>
          <p className="text-foreground font-medium">{email}</p>
        </div>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground">
          Click the link in your email to verify your account and access the app.
        </p>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleResendEmail}
            disabled={resending || cooldown > 0}
            variant="outline"
            className="w-full"
          >
            {resending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {cooldown > 0 
              ? `Resend in ${cooldown}s` 
              : 'Resend verification email'
            }
          </Button>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground pt-4">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationGate;
