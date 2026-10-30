import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { resolvePostAuthRoute } from '@/lib/auth/postAuthRoute';
import { isNewSignup } from '@/lib/auth/isNewSignup';
import type { MedianAppleError, MedianAppleResponse, MedianAppleSuccess } from '@/types/median';
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
import {
  clearGuestConversion,
  peekGuestConversion,
} from '@/features/guest/guestConversion';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { trackGuestConverted } from '@/features/guest/guestAnalytics';
import { GUEST_BROWSING_ENABLED } from '@/features/guest/guestConfig';
import { refreshGuestConversion } from '@/features/guest/refreshGuestConversion';

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
  /** Stage 2.6: claim navigation for the duration of a sign-in attempt;
   *  returns release() for attempts that end without navigating. */
  claimNavigation?: () => () => void;
}

const NOOP_RELEASE = () => {};

const AuthForm: React.FC<AuthFormProps> = ({ claimNavigation }) => {
  const claim = useCallback(() => (claimNavigation ? claimNavigation() : NOOP_RELEASE), [claimNavigation]);
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

  // ---- GUEST BROWSING §6: converting a guest -------------------------------
  // When a guest picks a join method, AuthForm runs with ?guest=1&start=<m>.
  // Apple/Google LINK the identity onto the anonymous user (same account,
  // same id); if the identity already belongs to another account the call
  // falls back to a normal sign-in so the flow still completes. Email OTP
  // confirms updateUser on the same user, or signs in an existing email account.
  const guestAutoStarted = useRef(false);
  const emailLinkModeRef = useRef(false);

  /** True only when the switch is on, the card handed off (?guest=1) and the
   *  current session is anonymous. Never throws. */
  const isGuestConverting = (): boolean => {
    if (!GUEST_BROWSING_ENABLED) return false;
    try {
      return searchParams.get('guest') === '1' && Boolean(getGuestUser());
    } catch (err) {
      console.warn('[guest-convert] guest check failed:', err);
      return false;
    }
  };

  // The sign-in path never depends on guest code: with the switch off both
  // helpers short-circuit before touching any guest module, and with it on a
  // fault in guest bookkeeping is logged and swallowed so sign-in still
  // navigates.
  const signInOrLinkIdToken = useCallback(
    async (provider: 'apple' | 'google', token: string) => {
      if (GUEST_BROWSING_ENABLED) {
        let shouldLink = false;
        try {
          shouldLink = Boolean(peekGuestConversion().guestUserId && getGuestUser());
        } catch (err) {
          console.warn('[guest-convert] guest check failed, signing in normally:', err);
        }
        if (shouldLink) {
          const linked = await supabase.auth.linkIdentity({ provider, token });
          if (!linked.error) {
            await refreshGuestConversion(true);
            return { data: linked.data, error: null, linked: true };
          }
          console.warn(`[guest-convert] linkIdentity(${provider}) failed, falling back to sign-in:`, linked.error.message);
        }
      }
      const res = await supabase.auth.signInWithIdToken({ provider, token });
      return { ...res, linked: false };
    },
    [],
  );

  const trackGuestConversionIfPending = useCallback(
    (method: 'apple' | 'google' | 'email' | 'login', linked: boolean) => {
      if (!GUEST_BROWSING_ENABLED) return;
      try {
        const conv = peekGuestConversion();
        if (!conv.guestUserId) return;
        trackGuestConverted({ method, linked, surface: conv.surface, guestUserId: conv.guestUserId });
        clearGuestConversion();
      } catch (err) {
        console.warn('[guest-convert] conversion tracking failed:', err);
      }
    },
    [],
  );

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
      // GUEST §6 email join: put the email on the anonymous user so the id is
      // kept; if it already belongs to an account, the normal email sign-in.
      emailLinkModeRef.current = false;
      if (GUEST_BROWSING_ENABLED && isGuestConverting()) {
        const linkRes = await supabase.auth.updateUser({ email: normalised });
        if (!linkRes.error) {
          emailLinkModeRef.current = true;
          trackAuthInitiated('email', Date.now() - sendStartRef.current);
          trackSignupInitiated('email');
          setEmailState(normalised);
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setSubmittingMethod(null);
          return true;
        }
        console.warn('[guest-convert] updateUser(email) failed, using normal email sign-in:', linkRes.error.message);
      }
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
    let release: (() => void) | null = null;
    let navigated = false;

    try {
      // A guest who joined by email confirms the change on the anonymous user.
      const emailLinked = GUEST_BROWSING_ENABLED && emailLinkModeRef.current;
      release = claim();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: emailLinked ? 'email_change' : 'email',
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
        await refreshGuestConversion(emailLinked);
        trackLoginSuccess('email', Date.now() - start);
        // Linked (updateUser) keeps the guest id; otherwise the session is replaced.
        trackGuestConversionIfPending('email', emailLinked);
        // Confirmation time covers a signup even when the email code was requested much earlier.
        if (isNewSignup(data.user)) {
          trackSignupSuccess('email', Date.now() - start);
        }
        trackAuthComplete('email');
        const dest = await resolvePostAuthRoute(
          data.session.user.id,
          searchParams.get('redirect'),
        );
        setStep('hero');
        navigate(dest, { replace: true });
        navigated = true;
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
    } finally {
      if (!navigated) release?.();
    }
  };

  // ---- Native Apple Sign-In (Median bridge) -------------------------------
  const handleAppleCallback = useCallback(
    async (response: MedianAppleResponse) => {
      oauthPendingRef.current = false;
      let release: (() => void) | null = null;
      let navigated = false;
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

        release = claim();
        const { data, error, linked } = await signInOrLinkIdToken('apple', idToken);

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
          trackGuestConversionIfPending('apple', linked);
          // Native account creation and sign-in timestamps can differ by milliseconds.
          if (isNewSignup(data.user)) {
            trackSignupSuccess('apple');
          }
          trackAuthComplete('apple');
          const dest = await resolvePostAuthRoute(
            data.session.user.id,
            searchParams.get('redirect'),
          );
          setStep('hero');
          navigate(dest, { replace: true });
          navigated = true;
        }
      } catch (err) {
        console.error('[apple-auth] sign-in threw:', err);
        trackAuthException('apple', (err as Error)?.message ?? String(err));
        toast.error('Could not complete Apple Sign-In. Please try again or use email.');
      } finally {
        if (!navigated) release?.();
        setSubmittingMethod(null);
      }
    },
    [navigate, searchParams, claim, signInOrLinkIdToken, trackGuestConversionIfPending],
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
      let release: (() => void) | null = null;
      let navigated = false;
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

        release = claim();
        const { data, error, linked } = await signInOrLinkIdToken('google', idToken);

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
          trackGuestConversionIfPending('google', linked);
          // Native account creation and sign-in timestamps can differ by milliseconds.
          if (isNewSignup(data.user)) {
            trackSignupSuccess('google');
          }
          trackAuthComplete('google');
          const dest = await resolvePostAuthRoute(
            data.session.user.id,
            searchParams.get('redirect'),
          );
          setStep('hero');
          navigate(dest, { replace: true });
          navigated = true;
        }
      } catch (err) {
        console.error('[google-auth] sign-in threw:', err);
        trackAuthException('google', (err as Error)?.message ?? String(err));
        toast.error('Could not complete Google Sign-In. Please try again or use email.');
      } finally {
        if (!navigated) release?.();
        setSubmittingMethod(null);
      }
    },
    [navigate, searchParams, claim, signInOrLinkIdToken, trackGuestConversionIfPending],
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

  // GUEST BROWSING §6: the join card hands off with ?guest=1&start=<method>.
  // Apple and Google start their native sheets immediately (one tap in the
  // card, one native prompt — no second tap on the auth screen). Email stays
  // on the hero, where the email field already lives.
  const guestStart =
    GUEST_BROWSING_ENABLED && searchParams.get('guest') === '1' ? searchParams.get('start') : null;
  useEffect(() => {
    if (!guestStart || guestAutoStarted.current) return;
    if (!isGuestConverting()) return;
    guestAutoStarted.current = true;
    if (guestStart === 'apple') handleAppleSignIn();
    else if (guestStart === 'google') handleGoogleSignIn();
  }, [guestStart, handleAppleSignIn, handleGoogleSignIn]);

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
