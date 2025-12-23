import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import {
  AuthHero,
  AuthBottomSheet,
  AuthTextField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthSocialButton,
  AuthDivider,
  InlineToast,
  LoadingOverlay,
} from '@/components/auth-v2';

type AuthStep = 'welcome' | 'email' | 'password' | 'create-password' | 'forgot-password';
type AuthIntent = 'login' | 'signup';

/**
 * AuthV2 - Immersive, world-class auth experience
 * 
 * Flow:
 * A0 - Welcome (full-bleed hero with CTA stack)
 * A1 - Email bottom sheet
 * A2 - Password (existing user)
 * A3 - Create password (new user)
 * A4 - Forgot password
 */
const AuthV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  
  // Hide nav elements
  useHideBottomNav();
  useHideHeader();

  // State
  const [step, setStep] = useState<AuthStep>('welcome');
  const [intent, setIntent] = useState<AuthIntent>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      const checkAndRedirect = async () => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, has_completed_onboarding')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || !profile.has_completed_onboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          const redirectPath = searchParams.get('redirect');
          navigate(redirectPath || '/clubhouse', { replace: true });
        }
      };
      checkAndRedirect();
    }
  }, [user, navigate, searchParams]);

  // Validation
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  // Clear errors on input change
  useEffect(() => { setEmailError(null); }, [email]);
  useEffect(() => { setPasswordError(null); }, [password, confirmPassword]);

  // Trigger shake animation
  const triggerShake = (field: 'email' | 'password') => {
    if (field === 'email') {
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 400);
    } else {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400);
    }
  };

  // Check if email exists
  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-email-exists', {
        body: { email: emailToCheck },
      });
      
      if (error) {
        console.error('Error checking email:', error);
        return false;
      }
      
      return data?.exists ?? false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  // Handlers
  const handleEmailContinue = async () => {
    if (!isEmailValid) {
      setEmailError("That doesn't look like a valid email.");
      triggerShake('email');
      return;
    }

    // LOGIN FLOW — explicit intent
    if (intent === 'login') {
      setIsExistingUser(true);
      setStep('password');
      return;
    }

    // SIGNUP FLOW — explicit intent
    setIsExistingUser(false);
    setStep('create-password');
  };

  const handleLogin = async () => {
    if (!isPasswordValid) {
      setPasswordError('Password must be at least 8 characters');
      triggerShake('password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login')) {
        setPasswordError('Email or password is incorrect.');
      } else if (error.message.includes('Too many')) {
        setPasswordError('Too many attempts. Try again in a few minutes.');
      } else {
        setPasswordError(error.message);
      }
      triggerShake('password');
    }
    // Success handled by useEffect watching user
  };

  const handleSignUp = async () => {
    if (!isPasswordValid) {
      setPasswordError('Use 8+ characters. Add a number for strength.');
      triggerShake('password');
      return;
    }

    if (!passwordsMatch) {
      setPasswordError("Passwords don't match.");
      triggerShake('password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { onboarding_status: 'started' },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setPasswordError('This email is already registered.');
        setStep('password');
      } else {
        setPasswordError(error.message);
      }
      triggerShake('password');
    }
    // Success handled by useEffect watching user
  };

  const handleForgotPassword = async () => {
    if (!isEmailValid) {
      setEmailError("That doesn't look like a valid email.");
      triggerShake('email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);

    if (error) {
      setToast({ type: 'error', message: 'Failed to send reset email.' });
    } else {
      setToast({ type: 'success', message: 'Check your email for a reset link.' });
      setTimeout(() => setStep('password'), 2000);
    }
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      setLoading(false);
      setToast({ type: 'error', message: `${provider === 'apple' ? 'Apple' : 'Google'} sign-in failed. Please try again.` });
    }
  };

  const handleBack = () => {
    if (step === 'forgot-password') {
      setStep('password');
    } else if (step === 'password' || step === 'create-password') {
      setStep('email');
    } else {
      setStep('welcome');
    }
  };

  const closeSheet = () => {
    setStep('welcome');
    setIntent('signup'); // Reset intent to default
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError(null);
    setPasswordError(null);
  };

  const isSheetOpen = step !== 'welcome';

  return (
    <>
      <LoadingOverlay show={loading} message="Please wait..." />
      
      <AuthHero>
        {/* Top: Logo */}
        <div className="flex justify-center pt-16 pb-8">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-12 w-auto"
          />
        </div>

        {/* Center: Headline */}
        <div className="flex-1 flex flex-col justify-center items-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Your golf life.
              <br />
              <span className="text-white/90">Captured.</span>
            </h1>
            <p className="text-lg text-white/60 max-w-sm mx-auto">
              Share moments. Track your journey. Discover courses.
            </p>
          </motion.div>
        </div>

        {/* Bottom: CTA Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="px-6 pb-8 space-y-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
        >
          <AuthSocialButton provider="apple" onClick={() => handleOAuth('apple')} />
          <AuthSocialButton provider="google" onClick={() => handleOAuth('google')} />
          
          <AuthDivider />
          
          <AuthSecondaryButton onClick={() => { setIntent('signup'); setStep('email'); }}>
            Continue with Email
          </AuthSecondaryButton>

          {/* Footer */}
          <div className="pt-4 text-center">
            <button
              onClick={() => { setIntent('login'); setStep('email'); }}
              className="text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Already a member?{' '}
              <span className="text-white/70 font-medium">Log in</span>
            </button>
          </div>

          <p className="text-xs text-white/30 text-center pt-2">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-white/50">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-white/50">Privacy Policy</a>.
          </p>
        </motion.div>
      </AuthHero>

      {/* Email Sheet (A1) */}
      <AuthBottomSheet
        isOpen={step === 'email'}
        onClose={closeSheet}
        title="Continue with email"
      >
        <div className="space-y-6">
          <p className="text-white/50 text-sm">
            We'll check if you already have an account.
          </p>

          <AuthTextField
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            shake={shakeEmail}
            autoFocus
          />

          <AuthPrimaryButton
            onClick={handleEmailContinue}
            disabled={!email.trim()}
            loading={loading}
          >
            Continue
          </AuthPrimaryButton>

          {toast && (
            <InlineToast
              type={toast.type}
              message={toast.message}
              show={!!toast}
              onDismiss={() => setToast(null)}
            />
          )}
        </div>
      </AuthBottomSheet>

      {/* Password Sheet (A2 - Existing User) */}
      <AuthBottomSheet
        isOpen={step === 'password'}
        onClose={closeSheet}
        title="Welcome back"
        showBackButton
        onBack={handleBack}
      >
        <div className="space-y-6">
          <div>
            <p className="text-white/50 text-sm mb-2">
              Sign in to jump back into your golf moments.
            </p>
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <span className="text-white/80">{email}</span>
              <button
                onClick={handleBack}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Change
              </button>
            </div>
          </div>

          <AuthTextField
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            shake={shakePassword}
            showPasswordToggle
            autoFocus
          />

          <AuthPrimaryButton
            onClick={handleLogin}
            disabled={!password.trim()}
            loading={loading}
          >
            Enter Clbhouz
          </AuthPrimaryButton>

          <button
            onClick={() => setStep('forgot-password')}
            className="w-full text-center text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </AuthBottomSheet>

      {/* Create Password Sheet (A3 - New User) */}
      <AuthBottomSheet
        isOpen={step === 'create-password'}
        onClose={closeSheet}
        title="Create your password"
        showBackButton
        onBack={handleBack}
      >
        <div className="space-y-6">
          <p className="text-white/50 text-sm">
            Use 8+ characters. Add a number for strength.
          </p>

          <div className="space-y-4">
            <AuthTextField
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
              autoFocus
            />

            <AuthTextField
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordError}
              shake={shakePassword}
              showPasswordToggle
            />
          </div>

          <AuthPrimaryButton
            onClick={handleSignUp}
            disabled={!password.trim() || !confirmPassword.trim()}
            loading={loading}
          >
            Create account
          </AuthPrimaryButton>
        </div>
      </AuthBottomSheet>

      {/* Forgot Password Sheet (A4) */}
      <AuthBottomSheet
        isOpen={step === 'forgot-password'}
        onClose={closeSheet}
        title="Reset your password"
        showBackButton
        onBack={handleBack}
      >
        <div className="space-y-6">
          <AuthTextField
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            shake={shakeEmail}
            autoFocus
          />

          <AuthPrimaryButton
            onClick={handleForgotPassword}
            disabled={!email.trim()}
            loading={loading}
          >
            Send reset link
          </AuthPrimaryButton>

          {toast && (
            <InlineToast
              type={toast.type}
              message={toast.message}
              show={!!toast}
              onDismiss={() => setToast(null)}
            />
          )}
        </div>
      </AuthBottomSheet>
    </>
  );
};

export default AuthV2;