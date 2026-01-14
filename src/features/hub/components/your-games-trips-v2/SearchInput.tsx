/**
 * SearchInput - Premium search field with inner shadow
 * V2 design: rounded, soft border, subtle focus state
 * V3: Added clear button when text is present
 * V4: Enhanced focus ring, smoother transitions
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search games or trips…' }: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className="relative rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
      }}
    >
      <Search 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-150"
        style={{ color: isFocused ? 'rgba(100, 116, 139, 0.7)' : 'rgba(100, 116, 139, 0.45)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3.5 text-[15px] rounded-2xl outline-none bg-transparent transition-all duration-200 placeholder:text-slate-400/60"
        style={{
          color: '#1e293b',
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {/* Clear button - animated appearance */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors hover:bg-black/5 active:scale-95"
            type="button"
            aria-label="Clear search"
          >
            <X 
              className="w-4 h-4"
              style={{ color: 'rgba(100, 116, 139, 0.55)' }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
