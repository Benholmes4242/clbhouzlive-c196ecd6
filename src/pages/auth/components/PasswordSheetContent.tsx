import React, { useRef, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';

interface PasswordSheetContentProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
  passwordError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onForgotPassword: () => void;
}

const PasswordSheetContent: React.FC<PasswordSheetContentProps> = ({
  email,
  password,
  setPassword,
  passwordError,
  submitting,
  onSubmit,
  onBack,
  onForgotPassword,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isPasswordValid = password.length >= 6;
  const isDisabled = submitting || !isPasswordValid;

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
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <span className="text-white/60 text-[14px] truncate">{email}</span>
      </div>
      
      <p className="text-white/60 text-[14px]">
        Enter your password to sign in.
      </p>
      
      <div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          disabled={submitting}
          className="w-full h-[52px] px-4 rounded-2xl text-white placeholder:text-white/40 text-[15px] focus:outline-none transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: passwordError ? '1px solid #E03131' : '1px solid rgba(255, 255, 255, 0.08)',
          }}
          autoComplete="current-password"
        />
        {passwordError && (
          <p className="text-[#E03131] text-[13px] mt-2">{passwordError}</p>
        )}
      </div>
      
      {/* Submit button - white, black text */}
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full h-[52px] flex items-center justify-center rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Enter clubhouse'
        )}
      </button>
      
      <button
        onClick={onForgotPassword}
        disabled={submitting}
        className="w-full text-center text-[14px] text-white/50 hover:text-white/70 transition-colors pt-1"
      >
        Forgot your password?
      </button>
    </div>
  );
};

export default PasswordSheetContent;