import React, { useRef, useEffect } from 'react';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordSheetContentProps {
  email: string;
  setEmail: (email: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  successMessage: string | null;
  errorMessage: string | null;
}

const ForgotPasswordSheetContent: React.FC<ForgotPasswordSheetContentProps> = ({
  email,
  setEmail,
  submitting,
  onSubmit,
  onBack,
  successMessage,
  errorMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isEmailValid = email.includes('@') && email.includes('.');
  const isDisabled = submitting || !isEmailValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      onSubmit();
    }
  };

  // Show success state
  if (successMessage) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="flex justify-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(47, 158, 68, 0.15)' }}
          >
            <CheckCircle className="w-8 h-8 text-[#2F9E44]" />
          </div>
        </div>
        <h3 className="text-white text-lg font-medium">Check your email</h3>
        <p className="text-white/60 text-[14px]">
          We've sent a password reset link to <span className="text-white">{email}</span>
        </p>
        <button
          onClick={onBack}
          className="w-full h-[52px] flex items-center justify-center rounded-full font-medium text-[16px] transition-all active:scale-[0.98] mt-4"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <span className="text-white text-[16px] font-medium">Reset password</span>
      </div>
      
      <p className="text-white/60 text-[14px]">
        Enter your email address and we'll send you a link to reset your password.
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
          className="w-full h-[52px] px-4 rounded-2xl text-white placeholder:text-white/40 text-[16px] focus:outline-none transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: errorMessage ? '1px solid #E03131' : '1px solid rgba(255, 255, 255, 0.08)',
          }}
          autoComplete="email"
        />
        {errorMessage && (
          <p className="text-[#E03131] text-[13px] mt-2">{errorMessage}</p>
        )}
      </div>
      
      {/* Submit button - white, black text */}
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full h-[52px] flex items-center justify-center rounded-full bg-white text-[#0D0F11] font-medium text-[16px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Send Reset Link'
        )}
      </button>
    </div>
  );
};

export default ForgotPasswordSheetContent;