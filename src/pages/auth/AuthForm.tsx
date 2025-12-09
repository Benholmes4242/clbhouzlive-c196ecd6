
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

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
        return;
      }
      if (!isPasswordValid) {
        setPasswordError("Password must be at least 6 characters");
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
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.user) {
        // Redirect to callback for profile setup
        navigate('/auth/callback');
      }
    } else {
      // EMAIL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPasswordError("Email or password is incorrect. Please try again.");
      } else if (data?.user) {
        // Redirect to callback
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
    // Check if email is empty
    if (!email.trim()) {
      setForgotPasswordMsg("Please enter your email first.");
      setForgotPasswordSuccess(false);
      return;
    }

    if (!isEmailValid) {
      setForgotPasswordMsg("Please enter a valid email address.");
      setForgotPasswordSuccess(false);
      return;
    }

    setSubmitting(true);
    setForgotPasswordMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setForgotPasswordMsg("Failed to send reset email. Please try again.");
      setForgotPasswordSuccess(false);
    } else {
      setForgotPasswordMsg("We've sent you a password reset link.");
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

  if (showForgotPassword) {
    return (
      <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleForgotPasswordClick(); }}>
        <div className="mb-4">
          <Input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={resetSubmitting}
            required
          />
        </div>
        <Button 
          type="submit" 
          variant="gradient-primary"
          disabled={resetSubmitting} 
          className="w-full mb-3"
        >
          {resetSubmitting ? "Sending..." : "Send Reset Email"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
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
      <div className="mb-4">
        <Input
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={submitting || showConfirmNotice}
          required
          className={emailError ? 'border-destructive focus-visible:border-destructive' : ''}
        />
        {emailError && (
          <p className="text-sm text-destructive mt-1">{emailError}</p>
        )}
        {forgotPasswordMsg && (
          <p className={`text-sm mt-1 ${forgotPasswordSuccess ? 'text-green-600' : 'text-destructive'}`}>
            {forgotPasswordMsg}
          </p>
        )}
      </div>
      
      {isSignUp && (
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Username"
              disabled={submitting || showConfirmNotice}
              required
              className={`pr-10 ${
                usernameAvailable === true ? 'border-green-500' : 
                usernameAvailable === false ? 'border-destructive' : ''
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {checkingUsername ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : usernameAvailable === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : usernameAvailable === false ? (
                <X className="w-4 h-4 text-destructive" />
              ) : null}
            </div>
          </div>
          
          {usernameAvailable === false && suggestedUsernames.length > 0 && (
            <div className="mt-2 p-2 bg-slate-50 rounded-sq-xs text-base">
              <p className="text-slate-600 mb-2">Username taken. Try these:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedUsernames.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setUsername(suggestion);
                      checkUsernameAvailability(suggestion);
                    }}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded-sq-xs text-sm hover:bg-slate-200"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {username.length > 0 && username.length < 3 && (
            <p className="text-sm text-destructive mt-1">Username must be at least 3 characters</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <Input
          ref={passwordInputRef}
          type="password"
          value={password}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          disabled={submitting || showConfirmNotice}
          required
          className={passwordError ? 'border-destructive focus-visible:border-destructive' : ''}
        />
        {passwordError && (
          <p className="text-sm text-destructive mt-1">{passwordError}</p>
        )}
      </div>
      {!showConfirmNotice && (
        <>
          <Button 
            type="submit" 
            disabled={submitting || (!isSignUp && !isFormValid) || (isSignUp && usernameAvailable !== true)} 
            className="w-full mb-3 text-white hover:opacity-90"
            style={{ backgroundColor: '#0a0a0a' }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSignUp ? "Signing up..." : "Signing in..."}
              </span>
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </Button>
          
          {/* Social Login Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-slate-300"></div>
            <span className="mx-4 text-base text-slate-500">or</span>
            <div className="flex-1 border-t border-slate-300"></div>
          </div>
          
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>
            
            <Button
              type="button"
              onClick={handleAppleSignIn}
              disabled={submitting}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              Continue with Apple
            </Button>
          </div>
          
          {!isSignUp && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline mt-4"
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
