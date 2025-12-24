import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface EmailSheetContentProps {
  email: string;
  setEmail: (email: string) => void;
  emailError: string | null;
  submitting: boolean;
  onContinue: () => void;
  isLoginIntent: boolean;
}

const EmailSheetContent: React.FC<EmailSheetContentProps> = ({
  email,
  setEmail,
  emailError,
  submitting,
  onContinue,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isDisabled = submitting || !isEmailValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      onContinue();
    }
  };

  const getInputBackground = () => {
    if (isFocused) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.05)';
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
          disabled={submitting}
          className="w-full h-[54px] px-4 rounded-2xl text-white text-[15px] focus:outline-none transition-all duration-200"
          style={{
            fontFamily: 'SF Pro Text, system-ui, sans-serif',
            background: getInputBackground(),
            border: emailError 
              ? '1px solid #E03131' 
              : '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: isFocused 
              ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
              : 'none',
          }}
          autoComplete="email"
        />
        <style>{`
          input::placeholder {
            color: rgba(255, 255, 255, 0.35);
            font-size: 14px;
          }
        `}</style>
        {emailError && (
          <p className="text-[#E03131] text-[13px] mt-2">{emailError}</p>
        )}
      </div>
      
      {/* Continue button - premium white */}
      <button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full h-[54px] flex items-center justify-center rounded-full text-[15px] transition-all duration-200 active:scale-[0.98]"
        style={{
          fontFamily: 'SF Pro Text, system-ui, sans-serif',
          fontWeight: 500,
          background: isDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
          color: '#0D0F11',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
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

export default EmailSheetContent;
