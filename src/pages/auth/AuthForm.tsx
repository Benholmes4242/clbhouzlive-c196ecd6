import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  trackAuthMethodSelected,
  trackAuthInitiated,
  trackAuthFailed,
  trackAuthException,
  trackLoginSuccess,
} from '@/lib/authAnalytics';

import AuthHeroScreen from './components/AuthHeroScreen';
import AuthBottomSheet from './components/AuthBottomSheet';
import OtpSheetContent from './components/OtpSheetContent';
import { AuthSuccessAnimation } from '@/components/auth/AuthSuccessAnimation';

type AuthNotice = {
  type: 'success' | 'error';
  message: string;
} | null;

interface AuthFormProps {
  // Kept for back-compat with the existing Auth.tsx wrapper. Most are unused.
  isSignUp?: boolean;
  setIsSignUp?: (b: boolean) => void;
  setErrorMsg?: (msg: string | null) => void;
  setSubmitting?: (b: boolean) => void;
  setResendMsg?: (msg: string | null) => void;
  lastResendEmail?: React.MutableRefObject<string>;
  setEmail?: (email: string) => void;
  setPassword?: (password: string) => void;
  email?: string;
  password?: string;
  submitting?: boolean;
  authNotice?: AuthNotice;
  setAuthNotice?: (notice: AuthNotice) => void;
}

const sanitiseErrorForAnalytics = (message?: string): string => {
  if (!message) return 'auth_error';
  const m = message.toLowerCase();
  if (m.includes('expired')) return 'otp_expired';
  if (m.includes('invalid')) return 'otp_invalid';
  if (m.includes('rate') || m.includes('too many')) return 'rate_limited';
  if (m.includes('network') || m.includes('fetch')) return 'network_error';
  return 'auth_error';
};

type Step = 'hero' | 'otp';

const RESEND_COOLDOWN_SECONDS = 30;

const AuthForm: React.FC<AuthFormProps> = ({ authNotice }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('hero');
  const [email, setEmailState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpErrorNonce, setOtpErrorNonce] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const sendStartRef = useRef<number>(0);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const sendCode = async (rawEmail: string): Promise<boolean> => {
    const normalised = rawEmail.trim().toLowerCase();
    setSubmitting(true);
    setOtpError(null);
    trackAuthMethodSelected('email');
    sendStartRef.current = Date.now();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalised,
        options: { shouldCreateUser: true },
      });

      if (error) {
        const msg =
          (error as { status?: number }).status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : error.message || 'Could not send code. Please try again.';
        trackAuthFailed(
          'email',
          sanitiseErrorForAnalytics(error.message),
          Date.now() - sendStartRef.current,
        );
        setOtpError(msg);
        setOtpErrorNonce((n) => n + 1);
        setSubmitting(false);
        return false;
      }

      trackAuthInitiated('email', Date.now() - sendStartRef.current);
      setEmailState(normalised);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSubmitting(false);
      return true;
    } catch (err) {
      const e = err as Error;
      trackAuthException('email', e.message);
      setOtpError('Something went wrong. Please try again.');
      setOtpErrorNonce((n) => n + 1);
      setSubmitting(false);
      return false;
    }
  };

  const handleSubmitEmail = async (rawEmail: string) => {
    const ok = await sendCode(rawEmail);
    if (ok) setStep('otp');
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || submitting) return;
    setOtpError(null);
    await sendCode(email);
  };

  const handleUseDifferentEmail = () => {
    setStep('hero');
    setOtpError(null);
    setResendCooldown(0);
  };

  const handleVerify = async (token: string) => {
    setSubmitting(true);
    setOtpError(null);
    const start = Date.now();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      });

      if (error) {
        const lower = (error.message || '').toLowerCase();
        const status = (error as { status?: number }).status;
        let friendly = error.message || 'Could not verify code.';
        if (lower.includes('expired')) {
          friendly = 'That code has expired. Tap resend to get a new one.';
        } else if (lower.includes('invalid') || status === 401 || status === 403) {
          friendly = 'That code is not right. Check the email and try again.';
        }
        trackAuthFailed(
          'email',
          sanitiseErrorForAnalytics(error.message),
          Date.now() - start,
        );
        setOtpError(friendly);
        setOtpErrorNonce((n) => n + 1);
        setSubmitting(false);
        return;
      }

      if (data?.session?.user) {
        trackLoginSuccess('email', Date.now() - start);
        setShowSuccessAnimation(true);
      } else {
        setOtpError('Could not start session. Please try again.');
        setOtpErrorNonce((n) => n + 1);
        setSubmitting(false);
      }
    } catch (err) {
      const e = err as Error;
      trackAuthException('email', e.message);
      setOtpError('Something went wrong. Please try again.');
      setOtpErrorNonce((n) => n + 1);
      setSubmitting(false);
    }
  };

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    // AuthWrapper's onboarding gate will bounce new users to /edit-profile.
    navigate('/', { replace: true });
  };

  // ---- Native Apple Sign-In (Median bridge) -------------------------------
  const handleAppleCallback = useCallback(
    async (response: MedianAppleResponse) => {
      try {
        const idToken = (response as MedianAppleSuccess)?.idToken;
        if (!idToken) {
          setSubmitting(false);
          const msg = String((response as MedianAppleError)?.error ?? '');
          const cancelled = /cancel|1001/i.test(msg);
          if (!cancelled && msg) {
            console.error('[apple-auth] native error:', msg);
            trackAuthFailed('apple', msg);
            toast.error('Apple Sign-In failed. Please try again.');
          }
          return;
        }

        trackAuthInitiated('apple');

        // Diagnostic: decode claims locally (never log the raw token).
        try {
          const claims = JSON.parse(
            atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
          );
          console.log('[apple-auth] token claims:', {
            aud: claims.aud,
            iss: claims.iss,
            email: claims.email,
            email_verified: claims.email_verified,
            has_nonce: 'nonce' in claims,
          });
        } catch {
          /* non-fatal */
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: idToken,
        });

        if (error) {
          console.error('[apple-auth] supabase rejection:', (error as any).status, error.message);
          trackAuthFailed('apple', sanitiseErrorForAnalytics(error.message));
          toast.error('Could not complete Apple Sign-In. Please try again or use email.');
          setSubmitting(false);
          return;
        }

        // Apple sends first/last name ONLY on first-ever sign-in. Persist before navigating.
        const success = response as MedianAppleSuccess;
        const first = (success.firstName ?? '').trim();
        const last = (success.lastName ?? '').trim();
        if (data?.user && (first || last)) {
          const { error: nameErr } = await supabase
            .from('user_profiles')
            .update({
              ...(first ? { first_name: first } : {}),
              ...(last ? { last_name: last } : {}),
            })
            .eq('id', data.user.id)
            .is('first_name', null);
          if (nameErr) console.error('[apple-auth] name persist failed:', nameErr.message);
        }

        if (data?.session?.user) {
          trackLoginSuccess('apple');
          setShowSuccessAnimation(true);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const handleAppleSignIn = useCallback(() => {
    trackAuthMethodSelected('apple');
    const median = window.median;
    if (!median?.socialLogin?.apple?.login) {
      toast.error('Apple Sign-In needs the latest app version.');
      return;
    }
    setSubmitting(true);
    median.socialLogin.apple.login({
      callback: handleAppleCallback,
      scope: 'full_name, email',
    });
  }, [handleAppleCallback]);


  const isSheetOpen = step === 'otp';

  return (
    <>
      {showSuccessAnimation && (
        <AuthSuccessAnimation
          message="Welcome to clbhouz"
          onComplete={handleSuccessAnimationComplete}
          duration={800}
        />
      )}

      <div
        {...(isSheetOpen ? { inert: '' } : {})}
        style={isSheetOpen ? { pointerEvents: 'none' as const } : undefined}
      >
        <AuthHeroScreen
          submitting={submitting && step === 'hero'}
          onSubmitEmail={handleSubmitEmail}
          onAppleSignIn={handleAppleSignIn}
        />
      </div>

      <AuthBottomSheet
        isOpen={isSheetOpen}
        onClose={handleUseDifferentEmail}
        title="Check your email"
        subtitle={undefined}
      >
        <OtpSheetContent
          email={email}
          submitting={submitting && step === 'otp'}
          errorMessage={otpError}
          errorNonce={otpErrorNonce}
          resendCooldown={resendCooldown}
          onVerify={handleVerify}
          onResend={handleResend}
          onUseDifferentEmail={handleUseDifferentEmail}
        />
      </AuthBottomSheet>

      {step === 'hero' && authNotice && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div
            className="p-4 rounded-2xl text-center text-[14px]"
            style={{
              backgroundColor:
                authNotice.type === 'success'
                  ? 'rgba(47, 158, 68, 0.9)'
                  : 'rgba(224, 49, 49, 0.9)',
              color: 'white',
            }}
          >
            {authNotice.message}
          </div>
        </div>
      )}
    </>
  );
};

export default AuthForm;
