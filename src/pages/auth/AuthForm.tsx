import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import {
  trackAuthMethodSelected,
  trackAuthInitiated,
  trackAuthFailed,
  trackAuthException,
  trackSignupInitiated,
  trackSignupSuccess,
  trackSignupFailed,
  trackLoginSuccess,
  trackLoginFailed,
} from "@/lib/authAnalytics";

// New UI components (presentational only)
import AuthHeroScreen from "./components/AuthHeroScreen";
import AuthBottomSheet from "./components/AuthBottomSheet";
import EmailSheetContent from "./components/EmailSheetContent";
import PasswordSheetContent from "./components/PasswordSheetContent";
import SignupSheetContent from "./components/SignupSheetContent";
import ForgotPasswordSheetContent from "./components/ForgotPasswordSheetContent";
import { AuthSuccessAnimation } from "@/components/auth/AuthSuccessAnimation";

type AuthNotice = {
  type: 'success' | 'error';
  message: string;
} | null;

// UI view states - maps to existing isSignUp/showForgotPassword logic
type AuthView = 'entry' | 'email' | 'password' | 'signup' | 'forgot';

// Helper to sanitise error messages before sending to analytics
const sanitiseErrorForAnalytics = (message?: string): string => {
  if (!message) return 'auth_error';
  if (message.includes('Invalid login')) return 'invalid_credentials';
  if (message.includes('Email not confirmed')) return 'email_not_confirmed';
  if (message.includes('popup_closed')) return 'popup_closed';
  if (message.includes('network') || message.includes('fetch')) return 'network_error';
  if (message.includes('unauthorized') || message.includes('invalid')) return 'invalid_provider';
  if (message.includes('already registered')) return 'already_registered';
  return 'auth_error';
};

interface AuthFormProps {
  isSignUp: boolean;
  setIsSignUp: (b: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
  setSubmitting: (b: boolean) => void;
  setResendMsg: (msg: string | null) => void;
  lastResendEmail: React.MutableRefObject<string>;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  email: string;
  password: string;
  submitting: boolean;
  authNotice: AuthNotice;
  setAuthNotice: (notice: AuthNotice) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  setIsSignUp,
  setErrorMsg,
  setSubmitting,
  setResendMsg,
  lastResendEmail,
  setEmail,
  setPassword,
  email,
  password,
  submitting,
  authNotice,
  setAuthNotice,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // UI-only view state
  const [view, setView] = useState<AuthView>('entry');
  
  // Form fields
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Field-level error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  // Success animation state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle email prefill from query params (after email verification)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const confirmedParam = searchParams.get('confirmed');
    
    if (emailParam) {
      setEmail(emailParam);
      
      // Auto-open the password sheet since we have the email
      setView('password');
      
      // Show success notice if just confirmed
      if (confirmedParam === '1') {
        setAuthNotice({
          type: 'success',
          message: 'Email verified! Enter your password to sign in.',
        });
      }
      
      // Clear the query params to keep URL clean
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setEmail, setAuthNotice, setSearchParams]);

  // Clear errors when email/password change
  useEffect(() => {
    if (emailError) setEmailError(null);
  }, [email]);

  useEffect(() => {
    if (passwordError) setPasswordError(null);
  }, [password]);

  // Auto-dismiss authNotice after 4 seconds
  useEffect(() => {
    if (!authNotice) return;
    const timer = setTimeout(() => {
      setAuthNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [authNotice, setAuthNotice]);
  // ===================
  // EXISTING HANDLERS - UNCHANGED SUPABASE WIRING
  // ===================

  const handleGoogleSignIn = async () => {
    trackAuthMethodSelected('google');
    setSubmitting(true);
    setErrorMsg(null);
    
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        let errorMessage = 'Google sign-in failed.';
        
        if (error.message?.includes('popup_closed')) {
          errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Connection issue. Please check your internet and try again.';
        } else if (error.message?.includes('unauthorized') || error.message?.includes('invalid')) {
          errorMessage = 'Unable to verify with Google. Please try again.';
        }
        // D2: No longer appending raw error.message
        
        trackAuthFailed('google', sanitiseErrorForAnalytics(error.message), Date.now() - startTime);
        setErrorMsg(errorMessage);
        setSubmitting(false);
      } else {
        trackAuthInitiated('google', Date.now() - startTime);
      }
    } catch (error) {
      const err = error as Error;
      trackAuthException('google', err.message);
      setErrorMsg('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    trackAuthMethodSelected('apple');
    setSubmitting(true);
    setErrorMsg(null);
    
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        let errorMessage = 'Apple sign-in failed.';
        
        if (error.message?.includes('popup_closed')) {
          errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Connection issue. Please check your internet and try again.';
        } else if (error.message?.includes('unauthorized') || error.message?.includes('invalid')) {
          errorMessage = 'Unable to verify with Apple. Please try again.';
        }
        // D2: No longer appending raw error.message
        
        trackAuthFailed('apple', sanitiseErrorForAnalytics(error.message), Date.now() - startTime);
        setErrorMsg(errorMessage);
        setSubmitting(false);
      } else {
        trackAuthInitiated('apple', Date.now() - startTime);
      }
    } catch (error) {
      const err = error as Error;
      trackAuthException('apple', err.message);
      setErrorMsg('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    const isEmailValid = email.includes('@') && email.includes('.');
    const isPasswordValid = password.length >= 8;
    
    if (!isEmailValid) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!isPasswordValid) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    trackAuthMethodSelected('email');
    setSubmitting(true);
    setPasswordError(null);
    
    const startTime = Date.now();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      trackLoginFailed('email', sanitiseErrorForAnalytics(error.message), Date.now() - startTime);
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        setPasswordError("Your email isn't verified yet — check your inbox for the link we sent.");
      } else {
        setPasswordError("Email or password is incorrect");
      }
      setSubmitting(false);
    } else if (data?.user) {
      trackLoginSuccess('email', Date.now() - startTime);
      // Show success animation before redirect
      setSuccessMessage('Welcome back!');
      setShowSuccessAnimation(true);
    }
  };

  // Handler for inline email login from hero screen (with password bottom sheet)
  const handleInlineEmailLogin = async (loginEmail: string, loginPassword: string) => {
    trackAuthMethodSelected('email');
    setSubmitting(true);
    setErrorMsg(null);
    
    const startTime = Date.now();

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password: loginPassword 
    });
    
    if (error) {
      trackLoginFailed('email', sanitiseErrorForAnalytics(error.message), Date.now() - startTime);
      let msg: string;
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        msg = "Your email isn't verified yet — check your inbox for the link we sent.";
      } else if (error.message.includes('Invalid login')) {
        msg = 'Email or password is incorrect';
      } else {
        msg = 'Something went wrong. Please try again.';
      }
      setAuthNotice({ type: 'error', message: msg });
      setSubmitting(false);
    } else if (data?.user) {
      trackLoginSuccess('email', Date.now() - startTime);
      // Show success animation before redirect
      setSuccessMessage('Welcome back!');
      setShowSuccessAnimation(true);
    }
  };

  // Handler for resending verification email
  const handleResendVerification = async () => {
    if (!email) return;
    try {
      await supabase.auth.resend({ type: 'signup', email });
      setAuthNotice({ type: 'success', message: 'Verification email resent — check your inbox.' });
    } catch {
      setAuthNotice({ type: 'error', message: 'Could not resend. Please try again.' });
    }
  };

  // Handler for forgot password from hero screen
  const handleInlineForgotPassword = (forgotEmail: string) => {
    setEmail(forgotEmail);
    setView('forgot');
  };

  const handleSignup = async () => {
    // Validate username
    if (!username.trim() || username.length < 3) {
      setErrorMsg("Username must be at least 3 characters long");
      return;
    }

    if (usernameAvailable === false) {
      setErrorMsg("Please choose an available username");
      return;
    }

    // Validate password (minimum 8 characters)
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }

    // Validate confirm password matches
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }

    trackSignupInitiated('email');
    setSubmitting(true);
    // B1/D1: Removed console.log that exposed user email
    
    const startTime = Date.now();

    // Timeout protection - 30 seconds
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Signup timeout reached');
      setSubmitting(false);
      setErrorMsg("Signup is taking too long. Please check your connection and try again.");
    }, 30000);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://clbhouz.co.uk/verified",
          data: {
            username: username.trim(),  // Preserve case, just trim whitespace
          }
        }
      });

      clearTimeout(timeoutId);

      console.log('[Auth] Signup response:', { 
        hasError: !!error, 
        hasUser: !!data?.user,
        identitiesLength: data?.user?.identities?.length 
      });
      
      if (error) {
        if ((error as any)?.status === 429) {
          setErrorMsg('Too many attempts. Please wait a moment before trying again.');
        } else if (
          error.message.toLowerCase().includes('unique') ||
          error.message.toLowerCase().includes('duplicate') ||
          (error as any)?.code === '23505'
        ) {
          setUsernameAvailable(false);
          setErrorMsg("That username was just taken — please choose another");
        } else if (error.message.includes('already registered')) {
          setEmailError("This email is already registered");
          setView('email');
        } else {
          setErrorMsg('Something went wrong. Please try again.');
        }
        setSubmitting(false);
      } else if (data?.user?.identities?.length === 0) {
        // Email already registered but not confirmed
        safeLocalStorage.set('pending_signup_email', email);
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setView('entry');
        setAuthNotice({
          type: 'success',
          message: `This email is already registered. Check ${email} for a verification link, or try signing in.`,
        });
        setSubmitting(false);
      } else if (data?.user) {
        trackSignupSuccess('email', Date.now() - startTime);
        navigate('/auth/check-email', { state: { email }, replace: true });
      } else if (data && !data.user) {
        // Supabase returned success but no user — edge case fallback
        safeLocalStorage.set('pending_verification_email', email);
        setErrorMsg('Something went wrong. Please try again.');
        setSubmitting(false);
      } else {
        // Unexpected state - fail gracefully
        setErrorMsg('Something went wrong. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setSubmitting(false);
      console.error('[Auth] Signup error:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setErrorMsg("Network error. Please check your connection and try again.");
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleForgotPassword = async () => {
    const isEmailValid = email.includes('@') && email.includes('.');
    
    if (!email.trim()) {
      setForgotPasswordMsg("Please enter your email first");
      setForgotPasswordSuccess(false);
      return;
    }

    if (!isEmailValid) {
      setForgotPasswordMsg("Please enter a valid email address");
      setForgotPasswordSuccess(false);
      return;
    }

    setSubmitting(true);
    setForgotPasswordMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setForgotPasswordMsg("Failed to send reset email");
      setForgotPasswordSuccess(false);
    } else {
      setForgotPasswordMsg(null);
      setForgotPasswordSuccess(true);
    }

    setSubmitting(false);
  };

  // ===================
  // UI-ONLY NAVIGATION
  // ===================

  const handleEmailSignUp = () => {
    // Signup intent - will show signup form after email
    setIsSignUp(true);
    setEmailError(null);
    setView('email');
  };

  const handleLoginClick = () => {
    // Login intent - force login mode and open email sheet
    setIsSignUp(false);
    setEmailError(null);
    setPasswordError(null);
    setForgotPasswordMsg(null);
    setForgotPasswordSuccess(false);
    setView('email');
  };

  const handleEmailContinue = () => {
    const isEmailValid = email.includes('@') && email.includes('.');
    if (!isEmailValid) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Store email for resend functionality
    lastResendEmail.current = email;
    
    // Navigate to appropriate next step based on intent
    if (isSignUp) {
      setView('signup');
    } else {
      setView('password');
    }
  };

  const handleCloseSheet = () => {
    setView('entry');
    setEmailError(null);
    setPasswordError(null);
    setForgotPasswordMsg(null);
    setForgotPasswordSuccess(false);
    // D5: Clear password state when sheet closes
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setUsernameAvailable(null);
  };

  const handleBackToEmail = () => {
    setView('email');
    setPasswordError(null);
    setForgotPasswordMsg(null);
    setForgotPasswordSuccess(false);
  };

  const handleOpenForgotPassword = () => {
    setView('forgot');
    setForgotPasswordMsg(null);
    setForgotPasswordSuccess(false);
  };

  const handleBackFromForgot = () => {
    if (forgotPasswordSuccess) {
      // After successful reset, go back to password entry
      setView('password');
    } else {
      setView('password');
    }
    setForgotPasswordMsg(null);
    setForgotPasswordSuccess(false);
  };

  // ===================
  // RENDER
  // ===================

  // Determine which sheet is open
  const isSheetOpen = view !== 'entry';
  
  // Sheet titles and subtitles per spec
  const getSheetContent = () => {
    switch (view) {
      case 'email':
        return isSignUp 
          ? { title: 'Get started', subtitle: 'Enter your email to begin.' }
          : { title: 'Sign in with email', subtitle: 'Enter your email to continue.' };
      case 'password':
        return { title: 'Enter password', subtitle: 'Welcome back.' };
      case 'signup':
        return { title: 'Get started', subtitle: 'Enter your email to begin.' };
      case 'forgot':
        return { title: 'Reset password', subtitle: 'We\'ll send you a reset link.' };
      default:
        return { title: '', subtitle: '' };
    }
  };
  
  const { title: sheetTitle, subtitle: sheetSubtitle } = getSheetContent();

  // Handle success animation completion
  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    navigate('/auth/callback');
  };

  return (
    <>
      {/* Success animation overlay */}
      {showSuccessAnimation && (
        <AuthSuccessAnimation 
          message={successMessage}
          onComplete={handleSuccessAnimationComplete}
          duration={800}
        />
      )}

      {/* Hero entry screen — inert when a sheet is open (A40 focus trap) */}
      <div {...(isSheetOpen ? { inert: '' } : {})} style={isSheetOpen ? { pointerEvents: 'none' as const } : undefined}>
        <AuthHeroScreen
          onAppleSignIn={handleAppleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onEmailSignUp={handleEmailSignUp}
          onEmailLogin={handleInlineEmailLogin}
          onForgotPassword={handleInlineForgotPassword}
          submitting={submitting}
        />
      </div>

      {/* Bottom sheet for email/password flows */}
      <AuthBottomSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        title={sheetTitle}
        subtitle={sheetSubtitle}
      >
        {view === 'email' && (
          <EmailSheetContent
            email={email}
            setEmail={setEmail}
            emailError={emailError}
            setEmailError={setEmailError}
            submitting={submitting}
            onContinue={handleEmailContinue}
            isLoginIntent={!isSignUp}
            onSwitchToLogin={handleLoginClick}
          />
        )}
        
        {view === 'password' && (
          <PasswordSheetContent
            email={email}
            password={password}
            setPassword={setPassword}
            passwordError={passwordError}
            submitting={submitting}
            onSubmit={handleLogin}
            onBack={handleBackToEmail}
            onForgotPassword={handleOpenForgotPassword}
            onResendVerification={handleResendVerification}
          />
        )}
        
        {view === 'signup' && (
          <SignupSheetContent
            email={email}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            username={username}
            setUsername={setUsername}
            passwordError={passwordError}
            submitting={submitting}
            onSubmit={handleSignup}
            onBack={handleBackToEmail}
            usernameAvailable={usernameAvailable}
            setUsernameAvailable={setUsernameAvailable}
          />
        )}
        
        {view === 'forgot' && (
          <ForgotPasswordSheetContent
            email={email}
            setEmail={setEmail}
            submitting={submitting}
            onSubmit={handleForgotPassword}
            onBack={handleBackFromForgot}
            successMessage={forgotPasswordSuccess ? "Check your email for a reset link" : null}
            errorMessage={forgotPasswordMsg}
          />
        )}
      </AuthBottomSheet>

      {/* Success toast for signup verification - shown on entry screen */}
      {view === 'entry' && authNotice && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div 
            className="p-4 rounded-2xl text-center text-[14px]"
            style={{
              backgroundColor: authNotice.type === 'success' ? 'rgba(47, 158, 68, 0.9)' : 'rgba(224, 49, 49, 0.9)',
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
