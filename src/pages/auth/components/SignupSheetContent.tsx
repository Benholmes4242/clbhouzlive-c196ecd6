import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SignupSheetContentProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
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
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setTimeout(() => usernameRef.current?.focus(), 100);
  }, []);

  // Username validation: 3+ characters and available
  const isUsernameValid = username.length >= 3 && usernameAvailable === true;
  
  // Password validation: 8+ characters
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  
  // Password field is disabled until username is valid
  const isPasswordDisabled = !isUsernameValid || submitting;
  
  // Submit is disabled until both are valid
  const isSubmitDisabled = submitting || !isPasswordValid || !isUsernameValid;

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
    const cleanValue = value.replace('@', '');
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

  // When username becomes valid, focus password field
  useEffect(() => {
    if (isUsernameValid && !password) {
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, [isUsernameValid]);

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
    <div className="space-y-5">
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
          style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}
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
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
            placeholder="Username"
            disabled={submitting}
            className="w-full h-[54px] px-4 pr-10 rounded-2xl text-white text-[15px] focus:outline-none transition-all duration-200"
            style={{
              fontFamily: 'SF Pro Text, system-ui, sans-serif',
              background: getInputBackground(usernameFocused),
              border: getInputBorderColor(usernameAvailable, true),
              boxShadow: usernameFocused 
                ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
                : 'none',
            }}
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
            <p className="text-[#E03131] text-[13px] mb-2">
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
          <p className="text-[#E03131] text-[13px] mt-2">
            Username must be at least 3 characters
          </p>
        )}
      </div>
      
      {/* Password - disabled until username is valid */}
      <div>
        <input
          ref={passwordRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          placeholder="Create password"
          disabled={isPasswordDisabled}
          className="w-full h-[54px] px-4 rounded-2xl text-white text-[15px] focus:outline-none transition-all duration-200"
          style={{
            fontFamily: 'SF Pro Text, system-ui, sans-serif',
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
        />
        
        {/* Password hint - show when password field is enabled but empty/short */}
        {isUsernameValid && !passwordError && (
          <p className="text-white/40 text-[12px] mt-2">
            Minimum 8 characters
          </p>
        )}
        
        {passwordError && (
          <p className="text-[#E03131] text-[13px] mt-2">{passwordError}</p>
        )}
        {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && !passwordError && (
          <p className="text-[#E03131] text-[13px] mt-2">
            Password must be at least {MIN_PASSWORD_LENGTH} characters
          </p>
        )}
      </div>
      
      {/* Submit button - premium white */}
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="w-full h-[54px] flex items-center justify-center rounded-full text-[15px] transition-all duration-200 active:scale-[0.98]"
        style={{
          fontFamily: 'SF Pro Text, system-ui, sans-serif',
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
