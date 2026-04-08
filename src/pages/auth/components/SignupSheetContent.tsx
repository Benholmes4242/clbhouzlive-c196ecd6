import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

interface SignupSheetContentProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  username: string;
  setUsername: (username: string) => void;
  passwordError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  usernameAvailable: boolean | null;
  setUsernameAvailable: (available: boolean | null) => void;
}

// Password validation: minimum 8 characters
const MIN_PASSWORD_LENGTH = 8;

const SignupSheetContent: React.FC<SignupSheetContentProps> = ({
  email,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  username,
  setUsername,
  passwordError,
  submitting,
  onSubmit,
  onBack,
  usernameAvailable,
  setUsernameAvailable,
}) => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setTimeout(() => usernameRef.current?.focus(), 100);
  }, []);

  // Username validation: 3+ characters and available
  const isUsernameValid = username.length >= 3 && usernameAvailable === true;
  
  // Password validation: 8+ characters
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  
  // Confirm password validation
  const passwordsMatch = password === confirmPassword;
  const isConfirmPasswordValid = confirmPassword.length > 0 && passwordsMatch;
  
  // Show mismatch error only if user has typed in confirm field
  const showMismatchError = confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch;
  
  // Password field is disabled until username is valid
  const isPasswordDisabled = !isUsernameValid || submitting;
  
  // Confirm password disabled until password is valid
  const isConfirmPasswordDisabled = !isPasswordValid || !isUsernameValid || submitting;
  
  // Submit is disabled until all fields are valid
  const isSubmitDisabled = submitting || !isPasswordValid || !isUsernameValid || !isConfirmPasswordValid;

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim() || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      setSuggestedUsernames([]);
      return;
    }

    setCheckingUsername(true);
    try {
      // Case-insensitive uniqueness check using ilike
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .ilike('username', usernameToCheck)
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
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // H5: Only allow alphanumeric and underscores (matches DB trigger for OAuth)
    const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(cleanValue);
    
    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    // Debounce the check
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(cleanValue);
    }, 500);
  };

  const handleChipClick = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameAvailable(true);
    setSuggestedUsernames([]);
    // Focus password field when selecting a suggestion
    setTimeout(() => passwordRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitDisabled) {
      onSubmit();
    }
  };

  // REMOVED: Auto-focus effects that were causing focus to jump while typing
  // Users should manually tab between fields to prevent UX issues

  const getInputBackground = (focused: boolean, disabled: boolean = false) => {
    if (disabled) return 'rgba(255, 255, 255, 0.02)';
    if (focused) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getInputBorderColor = (state: boolean | null, isUsername: boolean = false) => {
    if (isUsername) {
      if (state === true) return '1px solid #2F9E44';
      if (state === false) return '1px solid #E03131';
    }
    return '1px solid rgba(255, 255, 255, 0.07)';
  };

  return (
    <div className="space-y-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
      {/* Back button and email display - breadcrumb style */}
      <div 
        className="flex items-center gap-2.5 py-2 px-3 rounded-xl -mx-1"
        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
      >
        <button
          onClick={onBack}
          disabled={submitting}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
        </button>
        <span 
          className="text-[13px] text-white/50 truncate"
        >
          {email}
        </span>
      </div>
      
      {/* Username */}
      <div>
        <div className="relative">
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setUsernameFocused(true);
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            }}
            onBlur={() => setUsernameFocused(false)}
            placeholder="Username"
            maxLength={20}
            disabled={submitting}
            className="w-full h-[54px] px-4 pr-10 rounded-2xl text-white text-[16px] focus:outline-none transition-all duration-200"
            style={{
              background: getInputBackground(usernameFocused),
              border: getInputBorderColor(usernameAvailable, true),
              boxShadow: usernameFocused 
                ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
                : 'none',
            }}
            tabIndex={1}
            aria-label="Username"
            autoComplete="username"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <style>{`
            input::placeholder {
              color: rgba(255, 255, 255, 0.35);
              font-size: 14px;
            }
          `}</style>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {checkingUsername ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
            ) : usernameAvailable === true ? (
              <Check className="w-4 h-4 text-[#2F9E44]" />
            ) : usernameAvailable === false ? (
              <X className="w-4 h-4 text-[#E03131]" />
            ) : null}
          </div>
        </div>
        
        {/* Username taken suggestions */}
        {usernameAvailable === false && suggestedUsernames.length > 0 && (
          <div className="mt-3">
            <p role="alert" className="text-[#E03131] text-[13px] mb-2">
              That username's taken. Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedUsernames.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleChipClick(suggestion)}
                  className="px-3 py-1.5 rounded-full text-white text-[13px] transition-all active:scale-95"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  @{suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {username.length > 0 && username.length < 3 && (
          <p role="alert" className="text-[#E03131] text-[13px] mt-2">
            Username must be at least 3 characters
          </p>
        )}
      </div>
      
      {/* Password - disabled until username is valid */}
      <div>
        <div className="relative">
          <input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setPasswordFocused(true);
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            }}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Create password"
            disabled={isPasswordDisabled}
            className="w-full h-[54px] px-4 pr-12 rounded-2xl text-white text-[16px] focus:outline-none transition-all duration-200"
            style={{
              background: getInputBackground(passwordFocused, isPasswordDisabled),
              border: passwordError 
                ? '1px solid #E03131' 
                : '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: passwordFocused 
                ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
                : 'none',
              opacity: isPasswordDisabled ? 0.5 : 1,
              cursor: isPasswordDisabled ? 'not-allowed' : 'text',
            }}
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            tabIndex={2}
            aria-label="Create password"
          />
          {!isPasswordDisabled && (
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-opacity"
              style={{ opacity: password.length > 0 ? 1 : 0.5 }}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-white/50" />
              ) : (
                <Eye className="w-4 h-4 text-white/50" />
              )}
            </button>
          )}
        </div>
        
        {/* Password strength indicator */}
        <PasswordStrengthIndicator 
          password={password}
          show={!isPasswordDisabled && (passwordFocused || password.length > 0)}
        />
        
        {passwordError && (
          <p role="alert" className="text-[#E03131] text-[13px] mt-2">{passwordError}</p>
        )}
      </div>
      
      {/* Confirm Password - disabled until password is valid */}
      <div>
        <div className="relative">
          <input
            ref={confirmPasswordRef}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setConfirmPasswordFocused(true);
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            }}
            onBlur={() => setConfirmPasswordFocused(false)}
            placeholder="Confirm password"
            disabled={isConfirmPasswordDisabled}
            className="w-full h-[54px] px-4 pr-12 rounded-2xl text-white text-[16px] focus:outline-none transition-all duration-200"
            style={{
              background: getInputBackground(confirmPasswordFocused, isConfirmPasswordDisabled),
              border: showMismatchError 
                ? '1px solid #E03131' 
                : isConfirmPasswordValid
                  ? '1px solid #2F9E44'
                  : '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: confirmPasswordFocused 
                ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
                : 'none',
              opacity: isConfirmPasswordDisabled ? 0.5 : 1,
              cursor: isConfirmPasswordDisabled ? 'not-allowed' : 'text',
            }}
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            tabIndex={3}
            aria-label="Confirm password"
          />
          {!isConfirmPasswordDisabled && (
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-opacity"
              style={{ opacity: confirmPassword.length > 0 ? 1 : 0.5 }}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-white/50" />
              ) : (
                <Eye className="w-4 h-4 text-white/50" />
              )}
            </button>
          )}
        </div>
        
        {showMismatchError && (
          <p role="alert" className="text-[#E03131] text-[13px] mt-2">Passwords don't match.</p>
        )}
        
        {isConfirmPasswordValid && (
          <p className="text-[#2F9E44] text-[12px] mt-2 flex items-center gap-1">
            <Check className="w-3 h-3" /> Passwords match
          </p>
        )}
      </div>
      
      {/* Submit button - premium white */}
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="w-full h-[54px] flex items-center justify-center rounded-full text-[16px] transition-all duration-200 active:scale-[0.98]"
        style={{
          fontWeight: 500,
          background: isSubmitDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
          color: '#0D0F11',
          cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
          opacity: isSubmitDisabled ? 0.6 : 1,
        }}
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Continue'
        )}
      </button>
    </div>
  );
};

export default SignupSheetContent;
