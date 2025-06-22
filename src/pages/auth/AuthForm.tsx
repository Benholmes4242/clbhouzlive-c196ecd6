
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
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(cleanValue);
    }, 500);

    return () => clearTimeout(timeoutId);
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
          disabled={resetSubmitting} 
          className="w-full mb-3 text-white hover:opacity-90"
          style={{ backgroundColor: '#322F30' }}
        >
          {resetSubmitting ? "Sending..." : "Send Reset Email"}
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
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
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
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
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {username.length > 0 && username.length < 3 && (
            <p className="text-xs text-red-500 mt-1">Username must be at least 3 characters</p>
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
            style={{ backgroundColor: '#322F30' }}
          >
            {isSignUp ? (submitting ? "Signing up..." : "Sign Up") : (submitting ? "Signing in..." : "Sign In")}
          </Button>
          {!isSignUp && (
            <button
              type="button"
              className="w-full text-xs text-muted-foreground underline-offset-4 hover:underline"
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
