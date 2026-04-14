import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailSheetContentProps {
  email: string;
  setEmail: (email: string) => void;
  emailError: string | null;
  setEmailError?: (error: string | null) => void;
  submitting: boolean;
  onContinue: () => void;
  isLoginIntent: boolean;
  onSwitchToLogin?: () => void;
}

const EmailSheetContent: React.FC<EmailSheetContentProps> = ({
  email,
  setEmail,
  emailError,
  setEmailError,
  submitting,
  onContinue,
  isLoginIntent,
  onSwitchToLogin,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showEmailExistsError, setShowEmailExistsError] = useState(false);
  
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Clear email exists error when email changes
  useEffect(() => {
    if (showEmailExistsError) {
      setShowEmailExistsError(false);
    }
  }, [email]);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isDisabled = submitting || checkingEmail || !isEmailValid;

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-email-exists', {
        body: { email: emailToCheck },
      });

      if (error) {
        console.error('[EmailSheetContent] Error checking email:', error);
        return false; // Assume doesn't exist on error, let signup handle it
      }

      return data?.exists === true;
    } catch (err) {
      console.error('[EmailSheetContent] Unexpected error:', err);
      return false;
    }
  };

  const handleContinue = async () => {
    if (!isEmailValid) {
      setEmailError?.("Please enter a valid email address");
      return;
    }

    // If signing up, check if email already exists
    if (!isLoginIntent) {
      setCheckingEmail(true);
      const exists = await checkEmailExists(email);
      setCheckingEmail(false);

      if (exists) {
        setShowEmailExistsError(true);
        return;
      }
    }

    // Email is valid and (for signup) doesn't exist
    setShowEmailExistsError(false);
    onContinue();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      handleContinue();
    }
  };

  const getInputBackground = () => {
    if (isFocused) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const handleLoginClick = () => {
    setShowEmailExistsError(false);
    onSwitchToLogin?.();
  };

  const handleDifferentEmailClick = () => {
    setShowEmailExistsError(false);
    setEmail('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-5">
      <div>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Email"
          disabled={submitting || checkingEmail}
          className="w-full h-[54px] px-4 rounded-2xl text-white text-[16px] focus:outline-none transition-all duration-200"
          style={{
            background: getInputBackground(),
            border: (emailError || showEmailExistsError)
              ? '1px solid #E03131' 
              : '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: isFocused 
              ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
              : 'none',
          }}
          autoComplete="email"
          aria-label="Email address"
          aria-invalid={!!(emailError || showEmailExistsError)}
          aria-describedby={emailError ? "email-error" : undefined}
          spellCheck={false}
        />
        <style>{`
          input::placeholder {
            color: rgba(255, 255, 255, 0.35);
            font-size: 14px;
          }
        `}</style>
        
        {/* Standard email error */}
        {emailError && !showEmailExistsError && (
          <p id="email-error" role="alert" className="text-[#E03131] text-[13px] mt-2">{emailError}</p>
        )}

        {/* Email exists error with action buttons */}
        {showEmailExistsError && (
          <div className="mt-3">
            <p className="text-[#E03131] text-[13px] mb-3">
              This email is already associated with an account.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoginClick}
                className="flex-1 h-[44px] rounded-full text-[14px] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: '#F7931E',
                  color: '#ffffff',
                  fontWeight: 700,
                  boxShadow: '0 2px 12px rgba(247,147,30,0.28)',
                }}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={handleDifferentEmailClick}
                className="flex-1 h-[44px] rounded-full text-[14px] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                Use different email
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Continue button - hidden when showing email exists error */}
      {!showEmailExistsError && (
        <button
          onClick={handleContinue}
          disabled={isDisabled}
          className="w-full h-[54px] flex items-center justify-center rounded-full text-[16px] transition-all duration-200 active:scale-[0.98]"
          style={{
            fontWeight: 700,
            background: isDisabled ? 'rgba(247,147,30,0.35)' : '#F7931E',
            color: '#ffffff',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            boxShadow: isDisabled ? 'none' : '0 4px 20px rgba(247,147,30,0.28)',
          }}
        >
          {(submitting || checkingEmail) ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Continue'
          )}
        </button>
      )}
    </div>
  );
};

export default EmailSheetContent;
