import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  isSignUp: boolean;
  setShowConfirmNotice: (b: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
  setSubmitting: (b: boolean) => void;
  setResendMsg: (msg: string | null) => void;
  lastResendEmail: React.MutableRefObject<string>;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  email: string;
  password: string;
  submitting: boolean;
  showConfirmNotice: boolean;
}

// Light theme input styling using design tokens
const lightInputStyles: React.CSSProperties = {
  height: '48px',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid #D6D9DE',
  borderRadius: '14px',
  color: 'var(--text-primary)',
  fontSize: '15px',
  paddingLeft: '16px',
  paddingRight: '16px',
  outline: 'none',
  width: '100%',
  transition: 'all 0.15s ease',
};

const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  setShowConfirmNotice,
  setErrorMsg,
  setSubmitting,
  setResendMsg,
  lastResendEmail,
  setEmail,
  setPassword,
  email,
  password,
  submitting,
  showConfirmNotice,
}) => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  
  // Field-level error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on email field
  useEffect(() => {
    if (emailInputRef.current && !isSignUp) {
      emailInputRef.current.focus();
    }
  }, [isSignUp]);

  // Validation helpers
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  // Clear field errors when user types
  useEffect(() => {
    if (emailError) setEmailError(null);
    if (forgotPasswordMsg) setForgotPasswordMsg(null);
    if (forgotPasswordSuccess) setForgotPasswordSuccess(false);
  }, [email]);

  useEffect(() => {
    if (passwordError) setPasswordError(null);
  }, [password]);

  // Shake animation trigger
  const triggerShake = (field: 'email' | 'password') => {
    if (field === 'email') {
      setShakeEmail(true);
      setTimeout(() => setShakeEmail(false), 500);
    } else {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim() || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      setSuggestedUsernames([]);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', usernameToCheck.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        setUsernameAvailable(null);
        return;
      }

      const isAvailable = !data;
      setUsernameAvailable(isAvailable);

      if (!isAvailable) {
        const suggestions = [];
        const baseUsername = usernameToCheck.toLowerCase();
        
        for (let i = 1; i <= 3; i++) {
          suggestions.push(`${baseUsername}${i}`);
          suggestions.push(`${baseUsername}_${Math.floor(Math.random() * 99)}`);
        }
        
        const availableSuggestions = [];
        for (const suggestion of suggestions) {
          const { data: existingUser } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', suggestion)
            .maybeSingle();
          
          if (!existingUser && availableSuggestions.length < 3) {
            availableSuggestions.push(suggestion);
          }
        }
        
        setSuggestedUsernames(availableSuggestions);
      } else {
        setSuggestedUsernames([]);
      }
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanValue = value.replace('@', '');
    setUsername(cleanValue);
    
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(cleanValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError(null);
    setPasswordError(null);
    setErrorMsg(null);
    setShowConfirmNotice(false);

    // Validation for login
    if (!isSignUp) {
      if (!isEmailValid) {
        setEmailError("Please enter a valid email address");
        triggerShake('email');
        return;
      }
      if (!isPasswordValid) {
        setPasswordError("Password must be at least 6 characters");
        triggerShake('password');
        return;
      }
    }

    setSubmitting(true);

    if (isSignUp) {
      // Validate username for signup
      if (!username.trim() || username.length < 3) {
        setErrorMsg("Username must be at least 3 characters long");
        setSubmitting(false);
        return;
      }

      if (usernameAvailable === false) {
        setErrorMsg("Please choose an available username");
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: username.toLowerCase(),
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setEmailError("This email is already registered");
          triggerShake('email');
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.user) {
        navigate('/auth/callback');
      }
    } else {
      // EMAIL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPasswordError("Email or password is incorrect");
        triggerShake('password');
      } else if (data?.user) {
        navigate('/auth/callback');
      }
    }

    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSignUp && isFormValid && !submitting) {
      handleAuth(e as unknown as React.FormEvent);
    }
  };

  const handleForgotPasswordClick = async () => {
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
      setForgotPasswordMsg("We've sent you a password reset link");
      setForgotPasswordSuccess(true);
    }

    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      setErrorMsg("Google sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      setErrorMsg("Apple sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  // Shake animation CSS
  const shakeAnimation = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
  `;

  // Disabled state styling
  const isButtonDisabled = submitting || (!isSignUp && !isFormValid) || (isSignUp && usernameAvailable !== true);

  if (showForgotPassword) {
    return (
      <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleForgotPasswordClick(); }}>
        <style>{shakeAnimation}</style>
        <div className="mb-4">
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={resetSubmitting}
            required
            style={lightInputStyles}
            className="placeholder:text-text-tertiary focus:border-slate-600 focus:shadow-[0_0_0_2px_rgba(44,52,64,0.12)]"
          />
        </div>
        <button 
          type="submit" 
          disabled={resetSubmitting} 
          className="w-full h-12 rounded-sq-sm font-medium text-white transition-all active:scale-[0.98]"
          style={{
            backgroundColor: resetSubmitting ? 'var(--text-tertiary)' : 'var(--surface-slate)',
            opacity: resetSubmitting ? 0.5 : 1,
            pointerEvents: resetSubmitting ? 'none' : 'auto',
          }}
        >
          {resetSubmitting ? "Sending..." : "Send Reset Email"}
        </button>
        <button
          type="button"
          className="w-full text-sm mt-4 transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => setShowForgotPassword(false)}
          disabled={resetSubmitting}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="w-full" onSubmit={handleAuth}>
      <style>{shakeAnimation}</style>
      
      {/* Email Input */}
      <div className="mb-4">
        <input
          ref={emailInputRef}
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={submitting || showConfirmNotice}
          required
          style={{
            ...lightInputStyles,
            borderColor: emailError ? '#ef4444' : '#D6D9DE',
            animation: shakeEmail ? 'shake 0.5s ease-in-out' : 'none',
          }}
          className="placeholder:text-text-tertiary focus:border-[#D6D9DE] focus:shadow-[0_0_0_4px_rgba(247,147,30,0.06)]"
        />
        {/* 12px reserved slot for validation messages - Apple-style */}
        <div className="h-3 flex items-center">
          {emailError && (
            <p className="text-[11px] leading-none mt-[1px] text-red-500">{emailError}</p>
          )}
          {forgotPasswordMsg && (
            <p className={cn("text-[11px] leading-none mt-[1px]", forgotPasswordSuccess ? "text-[#3F7F41]" : "text-red-500")}>
              {forgotPasswordMsg}
            </p>
          )}
        </div>
      </div>
      
      {/* Username (signup only) */}
      {isSignUp && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Username"
              disabled={submitting || showConfirmNotice}
              required
              style={{
                ...lightInputStyles,
                paddingRight: '40px',
                borderColor: usernameAvailable === true ? '#22c55e' : 
                  usernameAvailable === false ? '#ef4444' : 'rgba(151, 161, 170, 0.25)',
              }}
              className="placeholder:text-text-tertiary focus:border-slate-600"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {checkingUsername ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
              ) : usernameAvailable === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : usernameAvailable === false ? (
                <X className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
          </div>
          
          {usernameAvailable === false && suggestedUsernames.length > 0 && (
            <div 
              className="mt-2 p-3 rounded-sq-xs"
              style={{ backgroundColor: 'var(--bg-page)' }}
            >
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Username taken. Try these:
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestedUsernames.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setUsername(suggestion);
                      checkUsernameAvailability(suggestion);
                    }}
                    className="px-2 py-1 text-sm rounded-sq-xs transition-colors hover:bg-slate-200"
                    style={{ 
                      backgroundColor: 'rgba(151, 161, 170, 0.12)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {username.length > 0 && username.length < 3 && (
            <p className="text-sm mt-2" style={{ color: '#ef4444' }}>
              Username must be at least 3 characters
            </p>
          )}
        </div>
      )}
      
      {/* Password Input */}
      <div className="mb-5">
        <input
          ref={passwordInputRef}
          type="password"
          value={password}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          disabled={submitting || showConfirmNotice}
          required
          style={{
            ...lightInputStyles,
            borderColor: passwordError ? '#ef4444' : '#D6D9DE',
            animation: shakePassword ? 'shake 0.5s ease-in-out' : 'none',
          }}
          className="placeholder:text-text-tertiary focus:border-[#D6D9DE] focus:shadow-[0_0_0_4px_rgba(247,147,30,0.06)]"
        />
        {/* 12px reserved slot for password error - Apple-style */}
        <div className="h-3 flex items-center">
          {passwordError && (
            <p className="text-[11px] leading-none mt-[1px] text-red-500">{passwordError}</p>
          )}
        </div>
      </div>

      {!showConfirmNotice && (
        <>
          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={isButtonDisabled} 
            className="w-full h-12 rounded-sq-pill font-medium text-white transition-all active:scale-[0.98] hover:bg-[#171B1F]"
            style={{
              backgroundColor: isButtonDisabled ? '#D6D9DE' : '#1F2428',
              pointerEvents: isButtonDisabled ? 'none' : 'auto',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSignUp ? "Signing up…" : "Signing in…"}
              </span>
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </button>
          
          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(214, 217, 222, 0.5)' }} />
            <span 
              className="mx-4 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: 'var(--text-secondary)' }}
            >
              OR
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(214, 217, 222, 0.5)' }} />
          </div>
          
          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full h-12 rounded-sq-md flex items-center transition-all active:scale-[0.98] hover:bg-[#F4F5F7]"
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1.25px solid #D6D9DE',
              }}
            >
              <div className="w-12 flex items-center justify-center">
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              </div>
              <span 
                className="flex-1 text-center pr-12 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Continue with Google
              </span>
            </button>
            
            {/* Apple */}
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={submitting}
              className="w-full h-12 rounded-sq-md flex items-center transition-all active:scale-[0.98] hover:bg-[#F4F5F7]"
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1.25px solid #D6D9DE',
              }}
            >
              <div className="w-12 flex items-center justify-center">
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }} fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                )}
              </div>
              <span 
                className="flex-1 text-center pr-12 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Continue with Apple
              </span>
            </button>
          </div>
          
          {/* Forgot password */}
          {!isSignUp && (
            <button
              type="button"
              className="w-full text-sm mt-5 transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              onClick={handleForgotPasswordClick}
              disabled={submitting}
            >
              Forgot your password?
            </button>
          )}
        </>
      )}
    </form>
  );
};

export default AuthForm;
