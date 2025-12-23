import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  showPasswordToggle?: boolean;
  validationState?: 'idle' | 'checking' | 'valid' | 'invalid';
  shake?: boolean;
}

/**
 * Premium auth text field with validation states,
 * password toggle, and micro-animations
 */
const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(({
  label,
  error,
  hint,
  showPasswordToggle = false,
  validationState = 'idle',
  shake = false,
  className,
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle 
    ? (showPassword ? 'text' : 'password')
    : type;

  const getBorderColor = () => {
    if (error) return 'border-red-500';
    if (validationState === 'valid') return 'border-green-500';
    if (validationState === 'invalid') return 'border-red-500';
    if (isFocused) return 'border-white/40';
    return 'border-white/20';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-2">
          {label}
        </label>
      )}
      
      <motion.div
        animate={shake ? {
          x: [0, -4, 4, -4, 4, 0],
          transition: { duration: 0.4 }
        } : {}}
        className="relative"
      >
        <input
          ref={ref}
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full h-14 px-4 bg-white/5 border rounded-[14px] text-white text-base",
            "placeholder:text-white/40 outline-none transition-all duration-200",
            "focus:bg-white/10 focus:ring-2 focus:ring-white/10",
            getBorderColor(),
            showPasswordToggle || validationState !== 'idle' ? 'pr-12' : '',
            className
          )}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Validation state indicator */}
          {validationState === 'checking' && (
            <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
          )}
          {validationState === 'valid' && !showPasswordToggle && (
            <Check className="w-5 h-5 text-green-500" />
          )}
          {validationState === 'invalid' && !showPasswordToggle && (
            <X className="w-5 h-5 text-red-500" />
          )}

          {/* Password toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Error/Hint message */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-white/50"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

AuthTextField.displayName = 'AuthTextField';

export default AuthTextField;
