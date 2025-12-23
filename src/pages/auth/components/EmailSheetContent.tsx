import React, { useRef, useEffect } from 'react';
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
  isLoginIntent,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isDisabled = submitting || !isEmailValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      onContinue();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-[14px] mb-4">
        {isLoginIntent 
          ? "Enter your email to sign in to your account."
          : "Enter your email to get started."
        }
      </p>
      
      <div>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Email address"
          disabled={submitting}
          className="w-full h-[52px] px-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[15px] focus:outline-none focus:border-white/40 transition-colors"
          autoComplete="email"
        />
        {emailError && (
          <p className="text-[#E03131] text-[13px] mt-2">{emailError}</p>
        )}
      </div>
      
      <button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full h-[52px] flex items-center justify-center rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
