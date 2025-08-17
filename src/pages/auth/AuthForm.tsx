
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);

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
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
        return;
      }

      const isAvailable = !data;
      setUsernameAvailable(isAvailable);

      if (!isAvailable) {
        // Generate suggestions
        const suggestions = [];
        const baseUsername = usernameToCheck.toLowerCase();
        
        for (let i = 1; i <= 3; i++) {
          suggestions.push(`${baseUsername}${i}`);
          suggestions.push(`${baseUsername}_${Math.floor(Math.random() * 99)}`);
        }
        
        // Check which suggestions are available
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
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Remove @ symbol if user types it
    const cleanValue = value.replace('@', '');
    setUsername(cleanValue);
    
    // Debounce the username check
    setTimeout(() => {
      checkUsernameAvailability(cleanValue);
    }, 500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setShowConfirmNotice(false);

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

      // EMAIL SIGNUP - No email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          }
        }
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else if (data?.user) {
        // User is automatically signed in after signup
        console.log("User signed up successfully:", data.user);
      }
    } else {
      // EMAIL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
      }
      // On success, user is redirected by onAuthStateChange in main Auth file
    }

    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setResendMsg("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    }

    setResetSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    
    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    
    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <form className="w-full" onSubmit={handleForgotPassword}>
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
        />
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
                usernameAvailable === false ? 'border-red-500' : ''
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {checkingUsername ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : usernameAvailable === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : usernameAvailable === false ? (
                <X className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
          </div>
          
          {usernameAvailable === false && suggestedUsernames.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-base">
              <p className="text-gray-600 mb-2">Username taken. Try these:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedUsernames.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setUsername(suggestion);
                      checkUsernameAvailability(suggestion);
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {username.length > 0 && username.length < 3 && (
            <p className="text-sm text-red-500 mt-1">Username must be at least 3 characters</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <Input
          type="password"
          value={password}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={submitting || showConfirmNotice}
          required
        />
      </div>
      {!showConfirmNotice && (
        <>
          <Button 
            type="submit" 
            disabled={submitting || (isSignUp && usernameAvailable !== true)} 
            className="w-full mb-3 text-white hover:opacity-90"
            style={{ backgroundColor: '#000000' }}
          >
            {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
          </Button>
          
          {/* Social Login Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="mx-4 text-base text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
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
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <Button
              type="button"
              onClick={handleAppleSignIn}
              disabled={submitting}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </Button>
          </div>
          
          {!isSignUp && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline mt-4"
              onClick={() => setShowForgotPassword(true)}
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
