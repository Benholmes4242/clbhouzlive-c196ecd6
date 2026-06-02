import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

interface PasswordBottomSheetProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  onForgotPassword: () => void;
  submitting: boolean;
}

export const PasswordBottomSheet: React.FC<PasswordBottomSheetProps> = ({
  isOpen,
  email,
  onClose,
  onSubmit,
  onForgotPassword,
  submitting,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      // Delay focus to allow animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onSubmit(password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{
              backdropFilter: 'blur(4px)',
              background: 'rgba(0, 0, 0, 0.45)',
            }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[480px]"
          >
            <div
              className="rounded-t-[32px] pb-safe relative"
              style={{
                background: 'linear-gradient(180deg, #0A0E14 0%, #0C1119 100%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.6), 0 -2px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Top edge highlight */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[32px] pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.06), transparent)',
                }}
              />

              {/* Handle bar */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              {/* Content */}
              <div className="px-6 pt-4 pb-8">
                {/* Header */}
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.03em',
                    marginBottom: 4,
                  }}
                >
                  Enter password
                </h2>
                <p className="text-[14px] text-white/65" style={{ lineHeight: '1.45' }}>
                  Welcome back.
                </p>

                {/* Email row with back arrow - breadcrumb */}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2.5 mt-5 w-full py-2 px-3 rounded-xl -mx-1 transition-all active:scale-[0.99]"
                  style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
                  </div>
                  <span className="text-[13px] text-white/50 truncate">
                    {email}
                  </span>
                </button>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Password input */}
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      disabled={submitting}
                      autoComplete="current-password"
                      className="w-full h-[54px] px-4 pr-12 rounded-[14px] text-[15px] font-medium focus:outline-none transition-all disabled:opacity-50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.10)',
                        color: 'rgba(255, 255, 255, 0.92)',
                      }}
                    />
                    <style>{`
                      input::placeholder {
                        color: rgba(255, 255, 255, 0.55);
                        font-weight: 500;
                      }
                    `}</style>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Submit button - amber primary matching hero */}
                  <button
                    type="submit"
                    disabled={submitting || !password.trim()}
                    className="w-full h-[54px] flex items-center justify-center rounded-[14px] font-bold text-[15px] transition-all duration-150 active:scale-[0.98]"
                    style={{
                      background: password.trim() ? '#F7931E' : 'rgba(255,255,255,0.05)',
                      color: password.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                      border: password.trim() ? 'none' : '1px solid rgba(255,255,255,0.10)',
                      cursor: (!password.trim() || submitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Enter clubhouse'
                    )}
                  </button>
                </form>

                {/* Forgot password link */}
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="w-full text-center mt-4 text-[13px] text-white/40 hover:text-white/60 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PasswordBottomSheet;
