import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { resolvePostAuthRoute } from '@/lib/auth/postAuthRoute';
import {
  trackAuthMethodSelected,
  trackAuthInitiated,
  trackAuthFailed,
  trackAuthException,
  trackLoginSuccess,
  trackSignupInitiated,
  trackSignupSuccess,
  trackSignupFailed,
  trackAuthComplete,
} from '@/lib/authAnalytics';

import AuthHeroScreen from './components/AuthHeroScreen';
import AuthBottomSheet from './components/AuthBottomSheet';
import OtpSheetContent from './components/OtpSheetContent';

type AppleClaims = {
  aud?: string;
  iss?: string;
  email?: string;
  email_verified?: boolean;
  nonce?: string;
};

type GoogleClaims = {
  aud?: string;
  iss?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  nonce?: string;
};

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
type SubmittingMethod = 'email' | 'apple' | 'google' | null;

const RESEND_COOLDOWN_SECONDS = 30;

interface AuthFormProps {
  onWillNavigate?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onWillNavigate }) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>('hero');
  const [email, setEmailState] = useState('');
  const [submittingMethod, setSubmittingMethod] = useState<SubmittingMethod>(null);
  const submitting = submittingMethod !== null; // convenience for guards
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpErrorNonce, setOtpErrorNonce] = useState(0);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const sendStartRef = useRef<number>(0);
  const oauthPendingRef = useRef(false);

  // Safety net: if the app returns to foreground while we are stuck in
  // a submitting state started by a native OAuth sheet that never fired
  // its callback, clear the spinner so the user can retry. Guard against
  // the native OAuth race: some providers fire `visible` BEFORE the
  // Median callback runs signInWithIdToken - clearing immediately would
  // re-enable buttons mid-exchange. Hold 10s for OAuth flows.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (!oauthPendingRef.current) {
        setSubmittingMethod(null);
        return;
      }
      window.setTimeout(() => {
        if (oauthPendingRef.current) {
          oauthPendingRef.current = false;
          setSubmittingMethod(null);
        }
      }, 10000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const sendCode = async (rawEmail: string): Promise<boolean> => {
    if (submitting) return false;
    const normalised = rawEmail.trim().toLowerCase();
    setSubmittingMethod('email');
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
        trackSignupFailed('email', sanitiseErrorForAnalytics(error.message), Date.now() - sendStartRef.current);
        setOtpError(msg);
        setOtpErrorNonce((n) => n + 1);
        setSubmittingMethod(null);
        return false;
      }

      trackAuthInitiated('email', Date.now() - sendStartRef.current);
      trackSignupInitiated('email');
      setEmailState(normalised);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSubmittingMethod(null);
      return true;
    } catch (err) {
      const e = err as Error;
      trackAuthException('email', e.message);
      setOtpError('Something went wrong. Please try again.');
      setOtpErrorNonce((n) => n + 1);
      setSubmittingMethod(null);
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
    const ok = await sendCode(email);
    if (ok) setOtpInfo('New code sent — use the code from the most recent email.');
  };

  const handleUseDifferentEmail = () => {
    setStep('hero');
    setOtpError(null);
    setOtpInfo(null);
    setResendCooldown(0);
  };

  const handleVerify = async (token: string) => {
    setSubmittingMethod('email');
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
          friendly = 'That code is no longer valid — if you requested more than one, use the newest email.';
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
        setSubmittingMethod(null);
        return;
      }

      if (data?.session?.user) {
        trackLoginSuccess('email', Date.now() - start);
        // signup_success: verifyOtp lands the session; new users have created_at === last_sign_in_at
        if (data.user?.created_at && data.user?.last_sign_in_at && data.user.created_at === data.user.last_sign_in_at) {
          trackSignupSuccess('email', Date.now() - start);
        }
        trackAuthComplete('email');
        onWillNavigate?.();
        const dest = await resolvePostAuthRoute(
          data.session.user.id,
          searchParams.get('redirect'),
        );
        setStep('hero');
        navigate(dest, { replace: true });
      } else {
        setOtpError('Could not start session. Please try again.');
        setOtpErrorNonce((n) => n + 1);
        setSubmittingMethod(null);
      }
    } catch (err) {
      const e = err as Error;
      trackAuthException('email', e.message);
      setOtpError('Something went wrong. Please try again.');
      setOtpErrorNonce((n) => n + 1);
      setSubmittingMethod(null);
    }
  };

  // ---- Native Apple Sign-In (Median bridge) -------------------------------
  const handleAppleCallback = useCallback(
    async (response: MedianAppleResponse) => {
      oauthPendingRef.current = false;
      try {
        const idToken = (response as MedianAppleSuccess)?.idToken;
        if (!idToken) {
          setSubmittingMethod(null);
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
        trackSignupInitiated('apple');

        // Diagnostic: decode claims locally (never log the raw token).
        try {
          const claims: AppleClaims = JSON.parse(
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

        // DIAGNOSTIC (MICRO_BRIEF_APPLE_RESPONSE_DIAGNOSTIC) - remove once the Apple name-capture fix has shipped.
        const responseForLog = { ...(response ?? {}) } as Record<string, unknown>;
        if ('idToken' in responseForLog) responseForLog.idToken = '[REDACTED]';
        console.log('[apple-auth] raw response keys:', Object.keys(response ?? {}));
        console.log('[apple-auth] raw response:', JSON.stringify(responseForLog));

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: idToken,
        });

        if (error) {
          console.error('[apple-auth] supabase rejection:', (error as { status?: number }).status, error.message);
          trackAuthFailed('apple', sanitiseErrorForAnalytics(error.message));
          toast.error('Could not complete Apple Sign-In. Please try again or use email.');
          setSubmittingMethod(null);
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
          // signup_success: signInWithIdToken lands the session; new users have created_at === last_sign_in_at
          if (data.user?.created_at && data.user?.last_sign_in_at && data.user.created_at === data.user.last_sign_in_at) {
            trackSignupSuccess('apple');
          }
          trackAuthComplete('apple');
          onWillNavigate?.();
          const dest = await resolvePostAuthRoute(
            data.session.user.id,
            searchParams.get('redirect'),
          );
          setStep('hero');
          navigate(dest, { replace: true });
        }
      } finally {
        setSubmittingMethod(null);
      }
    },
    [navigate, searchParams, onWillNavigate],
  );

  const handleAppleSignIn = useCallback(() => {
    trackAuthMethodSelected('apple');
    const median = window.median;
    if (!median?.socialLogin?.apple?.login) {
      toast.error('Apple Sign-In needs the latest app version.');
      return;
    }
    setSubmittingMethod('apple');
    oauthPendingRef.current = true;
    median.socialLogin.apple.login({
      callback: handleAppleCallback,
      scope: 'full_name, email',
    });
  }, [handleAppleCallback]);

  // ---- Native Google Sign-In (Median bridge) ------------------------------
  const handleGoogleCallback = useCallback(
    async (response: unknown) => {
      oauthPendingRef.current = false;
      try {
        const r = (response ?? {}) as { idToken?: string; error?: string };
        const idToken = r.idToken;
        if (!idToken) {
          setSubmittingMethod(null);
          const msg = String(r.error ?? '');
          const cancelled = /cancel|canceled|cancelled|12501/i.test(msg);
          if (!cancelled && msg) {
            console.error('[google-auth] native error:', msg);
            trackAuthFailed('google', msg);
            toast.error('Google Sign-In failed. Please try again.');
          }
          return;
        }

        trackAuthInitiated('google');
        trackSignupInitiated('google');

        // Decode claims once for diagnostics + names.
        let claims: GoogleClaims | null = null;
        try {
          claims = JSON.parse(
            atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
          );
          console.log('[google-auth] token claims:', {
            aud: claims?.aud,
            iss: claims?.iss,
            email: claims?.email,
            email_verified: claims?.email_verified,
            has_nonce: !!claims && 'nonce' in claims,
          });
        } catch {
          /* non-fatal */
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          console.error('[google-auth] supabase rejection:', (error as { status?: number }).status, error.message);
          if (/nonce/i.test(error.message || '')) {
            console.error(
              '[google-auth] NONCE MISMATCH - enable Skip nonce checks in the Supabase Google provider settings',
            );
          }
          trackAuthFailed('google', sanitiseErrorForAnalytics(error.message));
          toast.error('Could not complete Google Sign-In. Please try again or use email.');
          setSubmittingMethod(null);
          return;
        }

        const first = (claims?.given_name ?? '').toString().trim();
        const last = (claims?.family_name ?? '').toString().trim();
        if (data?.user && (first || last)) {
          const { error: nameErr } = await supabase
            .from('user_profiles')
            .update({
              ...(first ? { first_name: first } : {}),
              ...(last ? { last_name: last } : {}),
            })
            .eq('id', data.user.id)
            .is('first_name', null);
          if (nameErr) console.error('[google-auth] name persist failed:', nameErr.message);
        }

        // Harvest Google avatar. Both `picture` (Google id_token claim) and
        // `avatar_url` (Supabase normalisation) end up in user_metadata with
        // the same URL — prefer picture, fall back to avatar_url. Only write
        // when the profile currently has NO photo; never overwrite a user's
        // uploaded picture. Failures here must never block sign-in.
        try {
          const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
          const googlePhoto =
            (typeof meta.picture === 'string' && meta.picture) ||
            (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
            null;
          if (data?.user && googlePhoto) {
            const { error: photoErr } = await supabase
              .from('user_profiles')
              .update({ profile_photo_url: googlePhoto })
              .eq('id', data.user.id)
              .is('profile_photo_url', null);
            if (photoErr) console.warn('[google-auth] avatar harvest failed:', photoErr.message);
          }
        } catch (harvestErr) {
          console.warn('[google-auth] avatar harvest threw:', harvestErr);
        }

        if (data?.session?.user) {
          trackLoginSuccess('google');
          // signup_success: signInWithIdToken lands the session; new users have created_at === last_sign_in_at
          if (data.user?.created_at && data.user?.last_sign_in_at && data.user.created_at === data.user.last_sign_in_at) {
            trackSignupSuccess('google');
          }
          trackAuthComplete('google');
          onWillNavigate?.();
          const dest = await resolvePostAuthRoute(
            data.session.user.id,
            searchParams.get('redirect'),
          );
          setStep('hero');
          navigate(dest, { replace: true });
        }
      } finally {
        setSubmittingMethod(null);
      }
    },
    [navigate, searchParams, onWillNavigate],
  );

  const handleGoogleSignIn = useCallback(() => {
    trackAuthMethodSelected('google');
    const median = window.median;
    if (!median?.socialLogin?.google?.login) {
      toast.error('Google Sign-In needs the latest app version.');
      return;
    }
    setSubmittingMethod('google');
    oauthPendingRef.current = true;
    median.socialLogin.google.login({ callback: handleGoogleCallback });
  }, [handleGoogleCallback]);



  const isSheetOpen = step === 'otp';

  return (
    <>
      <div
        {...(isSheetOpen ? { inert: '' } : {})}
        style={isSheetOpen ? { pointerEvents: 'none' as const } : undefined}
      >
        <AuthHeroScreen
          submittingMethod={step === 'hero' ? submittingMethod : null}
          onSubmitEmail={handleSubmitEmail}
          onAppleSignIn={handleAppleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          errorMessage={step === 'hero' ? otpError : null}
          errorNonce={otpErrorNonce}
        />

      </div>

      <AuthBottomSheet
        isOpen={isSheetOpen}
        onClose={handleUseDifferentEmail}
        title={t('otp.checkEmailTitle')}
        subtitle={undefined}
      >
        <OtpSheetContent
          email={email}
          submitting={submittingMethod === 'email' && step === 'otp'}
          errorMessage={otpError}
          infoMessage={otpInfo}
          errorNonce={otpErrorNonce}
          resendCooldown={resendCooldown}
          onVerify={handleVerify}
          onResend={handleResend}
          onUseDifferentEmail={handleUseDifferentEmail}
          onCodeEdit={() => setOtpInfo(null)}
        />
      </AuthBottomSheet>
    </>
  );
};

export default AuthForm;
