import React, { useRef, useEffect, useState } from 'react';
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
  onResendVerification?: () => void;
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
  onResendVerification,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const isPasswordValid = password.length >= 8;
  const isDisabled = submitting || !isPasswordValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      onSubmit();
    }
  };

  const getInputBackground = () => {
    if (isFocused) return 'rgba(255, 255, 255, 0.08)';
    return 'rgba(255, 255, 255, 0.05)';
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
        >
          {email}
        </span>
      </div>
      
      <div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Password"
          disabled={submitting}
          className="w-full h-[54px] px-4 rounded-2xl text-white text-[16px] focus:outline-none transition-all duration-200"
          style={{
            background: getInputBackground(),
            border: passwordError 
              ? '1px solid #E03131' 
              : '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: isFocused 
              ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)' 
              : 'none',
          }}
          autoComplete="current-password"
          aria-label="Password"
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error" : undefined}
          data-lpignore="true"
          data-form-type="other"
          data-1p-ignore="true"
          spellCheck={false}
        />
        <style>{`
          input::placeholder {
            color: rgba(255, 255, 255, 0.35);
            font-size: 14px;
          }
        `}</style>
        {passwordError && (
          <div className="mt-2">
            <p id="password-error" role="alert" className="text-[#E03131] text-[13px]">{passwordError}</p>
            {passwordError.includes("isn't verified") && onResendVerification && (
              <button
                type="button"
                onClick={onResendVerification}
                className="text-[13px] underline underline-offset-2 mt-1.5 transition-colors"
                style={{ color: 'rgba(245, 158, 11, 0.85)' }}
              >
                Resend verification email
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Submit button - premium white */}
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full h-[54px] flex items-center justify-center rounded-full text-[16px] transition-all duration-200 active:scale-[0.98]"
        style={{
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
          'Enter clubhouse'
        )}
      </button>
      
      {/* Forgot password - subtle, reassuring */}
      <button
        onClick={onForgotPassword}
        disabled={submitting}
        className="w-full text-center text-[13px] transition-colors pt-2 group"
        style={{ 
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <span className="group-hover:underline group-hover:text-white/55 transition-colors">
          Forgot your password?
        </span>
      </button>
    </div>
  );
};

export default PasswordSheetContent;
