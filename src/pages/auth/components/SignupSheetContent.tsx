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
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  
  useEffect(() => {
    setTimeout(() => usernameRef.current?.focus(), 100);
  }, []);

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
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanValue = value.replace('@', '');
    setUsername(cleanValue);
    
    // Debounce check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(cleanValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleChipClick = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameAvailable(true);
    setSuggestedUsernames([]);
  };

  const isPasswordValid = password.length >= 6;
  const isUsernameValid = username.length >= 3 && usernameAvailable === true;
  const isDisabled = submitting || !isPasswordValid || !isUsernameValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button and email display */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <span className="text-white/60 text-[14px] truncate">{email}</span>
      </div>
      
      <p className="text-white/60 text-[14px]">
        Create your clbhouz account.
      </p>
      
      {/* Username */}
      <div>
        <div className="relative">
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Username"
            disabled={submitting}
            className="w-full h-[52px] px-4 pr-10 rounded-2xl bg-white/10 border text-white placeholder:text-white/40 text-[15px] focus:outline-none transition-colors"
            style={{
              borderColor: usernameAvailable === true ? '#2F9E44' : 
                usernameAvailable === false ? '#E03131' : 'rgba(255,255,255,0.2)',
            }}
          />
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
                  className="px-3 py-1.5 rounded-full bg-white/10 text-white text-[13px] hover:bg-white/20 transition-colors"
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
      
      {/* Password */}
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Create password"
          disabled={submitting}
          className="w-full h-[52px] px-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[15px] focus:outline-none focus:border-white/40 transition-colors"
          autoComplete="new-password"
        />
        {passwordError && (
          <p className="text-[#E03131] text-[13px] mt-2">{passwordError}</p>
        )}
        {password.length > 0 && password.length < 6 && !passwordError && (
          <p className="text-white/50 text-[13px] mt-2">
            Password must be at least 6 characters
          </p>
        )}
      </div>
      
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full h-[52px] flex items-center justify-center rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Create Account'
        )}
      </button>
    </div>
  );
};

export default SignupSheetContent;
