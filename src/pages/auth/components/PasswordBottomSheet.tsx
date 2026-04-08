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
            className="fixed inset-0 bg-black/60 z-50"
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
              className="rounded-t-[20px] pb-safe"
              style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Drag indicator */}
              <div className="flex justify-center pt-3">
                <div className="w-10 h-1 rounded-full bg-neutral-600" />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>

              {/* Content */}
              <div className="px-6 pt-4 pb-8">
                {/* Header */}
                <h2
                  className="text-[22px] font-semibold text-white"
                >
                  Enter password
                </h2>
                <p
                  className="text-[16px] text-neutral-400 mt-1"
                >
                  Welcome back.
                </p>

                {/* Email row with back arrow */}
                <button
                  onClick={onClose}
                  className="flex items-center gap-3 mt-5 w-full group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-neutral-400" />
                  </div>
                  <span
                    className="text-[16px] text-neutral-300"
                  >
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
                      className="w-full h-[56px] px-5 pr-12 rounded-full bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 text-[16px] focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Submit button - white primary style when password present */}
                  <button
                    type="submit"
                    disabled={submitting || !password.trim()}
                    className={`w-full h-[56px] flex items-center justify-center rounded-full font-medium text-[16px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
                      password.trim() 
                        ? 'bg-white text-[#0D0F11] hover:bg-gray-50 active:brightness-95' 
                        : 'hover:bg-white/[0.08]'
                    }`}
                    style={{
                      ...(password.trim() 
                        ? { boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.08)' }
                        : { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.92)' }
                      ),
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
                  className="w-full text-center mt-4 text-[14px] text-neutral-500 hover:text-neutral-300 transition-colors"
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
